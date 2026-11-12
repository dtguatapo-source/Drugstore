import { Component, inject, signal, computed, ViewEncapsulation } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine';
import { PurchaseService } from '../../services/purchase.service';
import { SupplierService } from '../../services/supplier.service';
import { Supplier } from '../../models/supplier';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EstadoCarga } from '../../shared/estado-carga/estado-carga';

@Component({
  selector: 'app-purchases',
  standalone: true,
  // MIGRACIÓN ANGULAR 21: Se remueve CommonModule ya que el nuevo control flow (@for, @if) no lo requiere
  imports: [FormsModule, EstadoCarga],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css',
  encapsulation: ViewEncapsulation.None
})
export class Purchases {
  // MIGRACIÓN ANGULAR 21: Inyección de dependencias moderna mediante inject() en lugar de constructor
  private readonly medService = inject(MedicineService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly supplierService = inject(SupplierService);
  private readonly router = inject(Router);

  // MIGRACIÓN ANGULAR 21: Manejo de estado reactivo usando Signals para reemplazar variables simples
  readonly mensaje = signal<string>('');
  readonly error = signal<boolean>(false);
  readonly tablaTemporal = signal<any[]>([]);
  readonly listaMedicamentos = signal<Medicine[]>([]);
  readonly medEncontrado = signal<Medicine | undefined>(undefined);
  readonly proveedores = signal<Supplier[]>([]);
  readonly sugerencias = signal<Supplier[]>([]);
  readonly mostrarSugerencias = signal<boolean>(false);
  // Opción resaltada con las flechas del combobox (-1 = ninguna)
  readonly indiceActivo = signal<number>(-1);
  // Bloquea el doble submit: dos clics crearían dos compras y sumarían el stock dos veces
  readonly guardando = signal<boolean>(false);

  // Estado de la carga (S7): esta pantalla depende de las compras y de los medicamentos
  private readonly cargandoCompras = toSignal(this.purchaseService.cargando$, {
    initialValue: false
  });
  private readonly cargandoMedicamentos = toSignal(this.medService.cargando$, {
    initialValue: false
  });
  private readonly errorCompras = toSignal(this.purchaseService.errorCarga$, { initialValue: '' });
  private readonly errorMedicamentos = toSignal(this.medService.errorCarga$, { initialValue: '' });

  readonly cargando = computed(() => this.cargandoCompras() || this.cargandoMedicamentos());
  readonly errorCarga = computed(() => this.errorCompras() || this.errorMedicamentos());

  // Id de la opción activa para aria-activedescendant (null quita el atributo)
  readonly opcionActivaId = computed(() => {
    const indice = this.indiceActivo();

    if (!this.mostrarSugerencias() || indice < 0) {
      return null;
    }

    return `pur-opcion-${indice}`;
  });

  // Rango permitido para la fecha de compra: hoy y los 4 dias anteriores
  readonly fechaHoy = this.formatearFecha(new Date());
  readonly fechaMinima = this.formatearFecha(this.desplazarDias(new Date(), -4));

  newPurchase: any = {
    date: this.fechaHoy,
    provider: '',
    supplierId: null,
    invoiceNumber: '',
    medicineId: '',
    quantity: 0,
    purchasePrice: 0,
    salePrice: 0
  };

  private timeoutRef: any;

  constructor() {
    this.medService.medicines$.subscribe(data => {
      // MIGRACIÓN ANGULAR 21: Asignación de datos a la signal con .set()
      this.listaMedicamentos.set(data);
    });

    // El numero de factura se recalcula solo cada vez que cambian las compras guardadas
    this.purchaseService.purchases$.subscribe(data => {
      this.newPurchase.invoiceNumber = this.calcularSiguienteFactura(data);
    });

    // Proveedores registrados para el autocompletado del campo PROVEEDOR
    this.supplierService.suppliers$.subscribe(data => this.proveedores.set(data));
  }

  // Vuelve a pedir las compras y los medicamentos a PostgreSQL
  reintentar(): void {
    this.purchaseService.loadPurchases();
    this.medService.loadMedicines();
  }

  /* ===== Autocompletado de proveedores ===== */

  filtrarProveedores(): void {
    const termino = this.normalizarTexto(this.newPurchase.provider);

    const coincidencias = this.proveedores()
      .filter(p => {
        if (!termino) {
          return true;
        }
        return (
          this.normalizarTexto(p.name).includes(termino) ||
          this.normalizarTexto(p.nit).includes(termino)
        );
      })
      .slice(0, 8);

    this.sugerencias.set(coincidencias);
    this.mostrarSugerencias.set(true);
    this.indiceActivo.set(-1);
  }

  // Al escribir, el proveedor deja de estar seleccionado hasta que elija una sugerencia
  onProveedorInput(): void {
    this.newPurchase.supplierId = null;
    this.filtrarProveedores();
  }

  seleccionarProveedor(proveedor: Supplier): void {
    this.newPurchase.provider = proveedor.name;
    this.newPurchase.supplierId = proveedor.id;
    this.ocultarSugerencias();
  }

  ocultarSugerencias(): void {
    this.mostrarSugerencias.set(false);
    this.indiceActivo.set(-1);
  }

  /**
   * Combobox de proveedores: flechas para recorrer las opciones, Enter para
   * elegir la activa y Escape para cerrar la lista.
   */
  alPresionarTeclaProveedor(evento: KeyboardEvent): void {
    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        this.moverOpcion(1);
        return;
      case 'ArrowUp':
        evento.preventDefault();
        this.moverOpcion(-1);
        return;
      case 'Enter': {
        const elegido = this.opcionActiva();

        if (elegido) {
          evento.preventDefault();
          this.seleccionarProveedor(elegido);
        }
        return;
      }
      case 'Escape':
        evento.preventDefault();
        this.ocultarSugerencias();
        return;
      default:
        return;
    }
  }

  private moverOpcion(paso: number): void {
    // Si la lista está cerrada, la flecha la abre con las coincidencias actuales
    if (!this.mostrarSugerencias()) {
      this.filtrarProveedores();
    }

    const total = this.sugerencias().length;

    if (total === 0) {
      this.indiceActivo.set(-1);
      return;
    }

    const actual = this.indiceActivo();
    const siguiente = actual < 0 ? (paso > 0 ? 0 : total - 1) : actual + paso;

    // Sin saltos fuera de la lista: se detiene en los extremos
    this.indiceActivo.set(Math.min(Math.max(siguiente, 0), total - 1));
  }

  private opcionActiva(): Supplier | undefined {
    if (!this.mostrarSugerencias()) {
      return undefined;
    }

    return this.sugerencias()[this.indiceActivo()];
  }

  // Compara sin acentos ni mayusculas ("Farmacéutica" = "farmaceutica")
  private normalizarTexto(texto: string): string {
    return (texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  /* ===== Numeracion automatica de compras ===== */

  private calcularSiguienteFactura(compras: { invoiceNumber: string }[]): string {
    // Una compra se repite por cada item en la lista plana, por eso deduplicamos
    const numeros = [...new Set(compras.map(c => c.invoiceNumber).filter(Boolean))] as string[];

    const parseados = numeros
      // Separa el prefijo del bloque de digitos final (admite "FAC-12" y "F-2024-009")
      .map(numero => /^(.*?)(\d+)$/.exec(numero.trim()))
      .filter((match): match is RegExpExecArray => match !== null)
      .map(match => ({ prefijo: match[1], digitos: match[2], valor: Number(match[2]) }));

    if (parseados.length === 0) {
      return '1';
    }

    // Tomamos el mayor numero existente y conservamos su prefijo y su relleno de ceros
    const mayor = parseados.reduce((a, b) => (b.valor > a.valor ? b : a));
    const siguiente = String(mayor.valor + 1).padStart(mayor.digitos.length, '0');

    return mayor.prefijo + siguiente;
  }

  /* ===== Rango de fechas ===== */

  private desplazarDias(base: Date, dias: number): Date {
    const fecha = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    fecha.setDate(fecha.getDate() + dias);
    return fecha;
  }

  // Formato yyyy-MM-dd en hora local (toISOString() desplaza el dia por la zona horaria)
  private formatearFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private fechaEnRango(fecha: string): boolean {
    return !!fecha && fecha >= this.fechaMinima && fecha <= this.fechaHoy;
  }

  buscarMed(): void {
    // MIGRACIÓN ANGULAR 21: Lectura de la signal listaMedicamentos()
    const med = this.listaMedicamentos().find(m => m.id === this.newPurchase.medicineId);
    this.medEncontrado.set(med);

    if (med) {
      this.newPurchase.purchasePrice = med.purchasePrice;
      this.newPurchase.salePrice = med.salePrice;
    }
  }

  meterALista(): void {
    const p = this.newPurchase;

    if (!p.provider && !p.invoiceNumber && !p.date) {
      this.mostrarAlerta('Complete los datos de la compra', true);
      return;
    }

    if (!p.provider || !p.invoiceNumber) {
      this.mostrarAlerta('Falta proveedor o factura', true);
      return;
    }

    if (!this.fechaEnRango(p.date)) {
      this.mostrarAlerta('La fecha debe estar dentro de los últimos 4 días', true);
      return;
    }

    if (!p.medicineId && p.quantity <= 0) {
      this.mostrarAlerta('Seleccione producto y cantidad', true);
      return;
    }

    if (!p.medicineId) {
      this.mostrarAlerta('Seleccione un medicamento', true);
      return;
    }

    if (p.quantity <= 0) {
      this.mostrarAlerta('Cantidad inválida', true);
      return;
    }

    if (p.purchasePrice < 0 || p.salePrice < 0) {
      this.mostrarAlerta('Precios no pueden ser negativos', true);
      return;
    }

    // MIGRACIÓN ANGULAR 21: Uso de .update() para agregar un elemento a la lista reactiva
    this.tablaTemporal.update(prev => [...prev, { ...p }]);
    this.mostrarAlerta('Producto agregado', false);

    this.newPurchase.medicineId = '';
    this.newPurchase.quantity = 0;
    this.medEncontrado.set(undefined);
  }

  guardarCompra(): void {
    if (this.guardando()) {
      return;
    }

    if (this.tablaTemporal().length === 0) {
      this.mostrarAlerta('No hay productos en la lista', true);
      return;
    }

    // 👈 Tomamos el proveedor y factura del formulario (o del primer ítem de la tabla temporal)
    const provider = this.newPurchase.provider || this.tablaTemporal()[0]?.provider;
    const invoiceNumber = this.newPurchase.invoiceNumber || this.tablaTemporal()[0]?.invoiceNumber;

    if (!provider || !invoiceNumber) {
      this.mostrarAlerta('Complete datos de la compra', true);
      return;
    }

    // 👈 Enviamos la compra al Backend (crea/busca el proveedor, guarda la compra y NestJS suma el stock en BD)
    this.guardando.set(true);

    this.purchaseService
      .registrarCompraEnBackend(
        provider,
        invoiceNumber,
        this.tablaTemporal(),
        this.newPurchase.supplierId ?? undefined
      )
      .subscribe({
        next: () => {
          // 👈 Recargamos los medicamentos desde PostgreSQL para reflejar el nuevo stock y precios
          this.medService.loadMedicines();

          this.newPurchase = {
            date: this.fechaHoy,
            provider: '',
            supplierId: null,
            // Avanzamos el consecutivo al instante; el reload de compras lo confirma
            invoiceNumber: this.calcularSiguienteFactura([
              { invoiceNumber: this.newPurchase.invoiceNumber }
            ]),
            medicineId: '',
            quantity: 0,
            purchasePrice: 0,
            salePrice: 0
          };

          this.tablaTemporal.set([]);
          this.guardando.set(false);
          this.mostrarAlerta('Compra registrada correctamente', false);
        },
        error: (err) => {
          this.guardando.set(false);
          console.error('Error al guardar la compra en el backend:', err);
          const msgBackend =
            err?.error?.message || 'Error al registrar la compra en la base de datos';
          this.mostrarAlerta(
            Array.isArray(msgBackend) ? msgBackend[0] : msgBackend,
            true
          );
        }
      });
  }

  mostrarAlerta(msg: string, esError: boolean): void {
    this.mensaje.set(msg);
    this.error.set(esError);

    clearTimeout(this.timeoutRef);

    this.timeoutRef = setTimeout(() => {
      this.mensaje.set('');
    }, 2000);
  }

  cerrarAlerta(): void {
    this.mensaje.set('');
  }

  obtenerNombre(id: string): string { return this.listaMedicamentos().find(m => m.id === id)?.name || '---'; }
  obtenerLab(id: string): string { return this.listaMedicamentos().find(m => m.id === id)?.laboratory || '---'; }
  obtenerDesc(id: string): string { return this.listaMedicamentos().find(m => m.id === id)?.description || '---'; }

  regresar(): void {
    this.router.navigate(['/dashboard']);
  }
}
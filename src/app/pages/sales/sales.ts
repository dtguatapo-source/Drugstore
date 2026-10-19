import { Component, inject, ChangeDetectorRef, signal, computed } from '@angular/core';
import { SalesService } from '../../services/sales.service';
import { MedicineService } from '../../services/medicine.service';
import { Sale } from '../../models/sale';
import { Medicine } from '../../models/medicine';
import { Observable } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  // MIGRACIÓN ANGULAR 21: Importación directa de DecimalPipe y FormsModule
  imports: [FormsModule, DecimalPipe],
  templateUrl: './sales.html',
  styleUrl: './sales.css'
})
export class Sales {
  // MIGRACIÓN ANGULAR 21: Inyección moderna con inject()
  private readonly salesService = inject(SalesService);
  private readonly medicineService = inject(MedicineService);
  private readonly aiService = inject(AiService);
  private readonly cdr = inject(ChangeDetectorRef);

  // MIGRACIÓN ANGULAR 21: Manejo del estado usando Signals
  readonly mensaje = signal<string>('');
  readonly error = signal<boolean>(false);
  readonly medicines = signal<Medicine[]>([]);
  readonly filteredMedicines = signal<any[]>([]);
  readonly cart = signal<any[]>([]);
  readonly selectedMedicine = signal<any | undefined>(undefined);
  readonly discount = signal<number>(0); // 👈 Signal para el descuento aplicado

  // IA CHAT Signals
  readonly iaQuery = signal<string>('');
  readonly chatMessages = signal<any[]>([
    {
      sender: 'ia',
      text: ' Hola, soy tu asistente virtual de farmacia. ¿Cómo puedo ayudarte hoy?'
    }
  ]);
  readonly loadingIa = signal<boolean>(false);
  readonly textIaOpen = signal<boolean>(false);

  // 👈 Suma numérica garantizada del subtotal de cada producto en el carrito
  readonly totalCart = computed(() => {
    return this.cart().reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);
  });

  // 👈 Total final restando el descuento aplicado
  readonly totalACobrar = computed(() => {
    const desc = Number(this.discount()) || 0;
    return Math.max(0, this.totalCart() - desc);
  });

  sales$: Observable<Sale[]>;
  searchText: string = '';

  customer = {
    name: '',
    idNumber: '',
    date: new Date().toISOString().split('T')[0]
  };

  newSaleItem = {
    quantity: 1
  };

  private timeoutRef: any;

  constructor() {
    this.sales$ = this.salesService.sales$;
    this.medicineService.medicines$.subscribe(data => {
      this.medicines.set(data);
    });
  }

  // BUSCADOR
  onSearch(): void {
    if (this.searchText.length > 1) {
      const resultados = this.medicines()
        .map(m => {
          const enCarrito = this.cart()
            .filter(item => item.id === m.id)
            .reduce((acc, item) => acc + Number(item.cantVenta), 0);

          return {
            ...m,
            stockDisponible: Number(m.stock) - enCarrito
          };
        })
        .filter(m =>
          (m.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
           m.laboratory.toLowerCase().includes(this.searchText.toLowerCase()) ||
           m.id.toLowerCase().includes(this.searchText.toLowerCase())) &&
          m.stockDisponible > 0
        );

      this.filteredMedicines.set(resultados);
    } else {
      this.filteredMedicines.set([]);
    }
  }

  // SELECCIONAR MEDICAMENTO
  selectMed(med: any): void {
    this.selectedMedicine.set(med);
    this.searchText = med.name;
    this.filteredMedicines.set([]);
  }

  // AGREGAR AL CARRITO
  addToCart(): void {
    const med = this.selectedMedicine();
    if (!med) {
      this.mostrarAlerta('Seleccione un producto', true);
      return;
    }

    const cantidad = Number(this.newSaleItem.quantity) || 0; // 👈 Aseguramos que sea número
    const precioUnitario = Number(med.salePrice) || 0; // 👈 Aseguramos que sea número

    if (cantidad <= 0) {
      this.mostrarAlerta('Cantidad inválida', true);
      return;
    }

    const stockReal = Number(med.stockDisponible ?? med.stock);

    if (stockReal < cantidad) {
      this.mostrarAlerta('Stock insuficiente', true);
      return;
    }

    // 👈 Creamos un nuevo arreglo para que totalCart() y totalACobrar() se actualicen al instante
    this.cart.update(prev => [
      ...prev,
      {
        ...med,
        salePrice: precioUnitario,
        cantVenta: cantidad,
        subtotal: precioUnitario * cantidad
      }
    ]);

    this.mostrarAlerta('Producto agregado correctamente', false);

    // Limpiar formulario
    this.selectedMedicine.set(undefined);
    this.searchText = '';
    this.newSaleItem.quantity = 1;
  }

  // ELIMINAR PRODUCTO
  removeFromCart(index: number): void {
    this.cart.update(prev => prev.filter((_, i) => i !== index));
    this.mostrarAlerta('Producto eliminado', false);
  }

  // 👈 COMPLETAR VENTA CONECTADA AL BACKEND
  completeSale(): void {
    if (this.cart().length === 0) {
      this.mostrarAlerta('No hay productos en la venta', true);
      return;
    }

    const descuentoNum = Number(this.discount()) || 0;

    this.salesService
      .registrarVentaEnBackend(this.customer, this.cart(), descuentoNum)
      .subscribe({
        next: () => {
          this.medicineService.loadMedicines();

          // Limpiar carrito y formulario
          this.cart.set([]);
          this.discount.set(0);
          this.searchText = '';
          this.filteredMedicines.set([]);
          this.selectedMedicine.set(undefined);

          this.customer = {
            name: '',
            idNumber: '',
            date: new Date().toISOString().split('T')[0]
          };

          this.newSaleItem.quantity = 1;
          this.mostrarAlerta('Venta realizada correctamente', false);
        },
        error: (err) => {
          console.error('Error al registrar la venta en el backend:', err);
          const msgBackend =
            err?.error?.message || 'Error al registrar la venta en la base de datos';
          this.mostrarAlerta(
            Array.isArray(msgBackend) ? msgBackend[0] : msgBackend,
            true
          );
        }
      });
  }

  // CHAT IA
  async consultarIA(): Promise<void> {
    const query = this.iaQuery();
    if (!query.trim()) {
      this.mostrarAlerta('Por favor escribe un mensaje', true);
      return;
    }

    this.chatMessages.update(prev => [...prev, { sender: 'user', text: query }]);
    this.loadingIa.set(true);
    this.cdr.detectChanges();

    try {
      const respuestaIA = await this.aiService.recomendarMedicamento(query, this.medicines());
      this.chatMessages.update(prev => [...prev, { sender: 'ia', text: respuestaIA }]);
      this.iaQuery.set('');
    } catch (e) {
      this.mostrarAlerta('Ocurrio un error con la IA', true);
    } finally {
      this.loadingIa.set(false);
      this.cdr.detectChanges();
    }
  }

  // ALERTAS
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
}
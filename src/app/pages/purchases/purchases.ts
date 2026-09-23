import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine';
import { PurchaseService } from '../../services/purchase.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-purchases',
  standalone: true,
  // MIGRACIÓN ANGULAR 21: Se remueve CommonModule ya que el nuevo control flow (@for, @if) no lo requiere
  imports: [FormsModule],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css',
  encapsulation: ViewEncapsulation.None
})
export class Purchases {
  // MIGRACIÓN ANGULAR 21: Inyección de dependencias moderna mediante inject() en lugar de constructor
  private readonly medService = inject(MedicineService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly router = inject(Router);

  // MIGRACIÓN ANGULAR 21: Manejo de estado reactivo usando Signals para reemplazar variables simples
  readonly mensaje = signal<string>('');
  readonly error = signal<boolean>(false);
  readonly tablaTemporal = signal<any[]>([]);
  readonly listaMedicamentos = signal<Medicine[]>([]);
  readonly medEncontrado = signal<Medicine | undefined>(undefined);

  newPurchase: any = {
    date: '',
    provider: '',
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
    if (this.tablaTemporal().length === 0) {
      this.mostrarAlerta('No hay productos en la lista', true);
      return;
    }

    if (!this.newPurchase.provider || !this.newPurchase.invoiceNumber) {
      this.mostrarAlerta('Complete datos de la compra', true);
      return;
    }

    this.tablaTemporal().forEach(item => {
      let m = this.listaMedicamentos().find(aux => aux.id === item.medicineId);

      if (m) {
        m.stock = m.stock + item.quantity;
        this.medService.updateMedicine(m);

        this.purchaseService.addPurchase({
          id: Date.now().toString(),
          date: item.date || new Date().toISOString().split('T')[0],
          provider: item.provider,
          invoiceNumber: item.invoiceNumber,
          medicineId: item.medicineId,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          salePrice: item.salePrice,
          total: item.quantity * item.purchasePrice
        });
      }
    });

    this.newPurchase = {
      date: '',
      provider: '',
      invoiceNumber: '',
      medicineId: '',
      quantity: 0,
      purchasePrice: 0,
      salePrice: 0
    };

    this.mostrarAlerta('Compra registrada correctamente', false);
    this.tablaTemporal.set([]);
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
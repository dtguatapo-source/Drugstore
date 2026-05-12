import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine';
import { PurchaseService } from '../../services/purchase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css',
  encapsulation: ViewEncapsulation.None
})
export class Purchases {

  mensaje: string = '';
  error: boolean = false;

  private timeoutRef: any;

  private medService = inject(MedicineService);
  private purchaseService = inject(PurchaseService);
  private router = inject(Router);

  tablaTemporal: any[] = [];
  listaMedicamentos: Medicine[] = [];
  medEncontrado?: Medicine;

  newPurchase: any = {
    date: '',
    provider: '',
    invoiceNumber: '',
    medicineId: '',
    quantity: 0,
    purchasePrice: 0,
    salePrice: 0
  };

  constructor() {
    this.medService.medicines$.subscribe(data => {
      this.listaMedicamentos = data;
    });
  }

  buscarMed() {
    this.medEncontrado = this.listaMedicamentos.find(m => m.id === this.newPurchase.medicineId);

    if (this.medEncontrado) {
      this.newPurchase.purchasePrice = this.medEncontrado.purchasePrice;
      this.newPurchase.salePrice = this.medEncontrado.salePrice;
    }
  }

  meterALista() {

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

    this.tablaTemporal.push({ ...p });

    this.mostrarAlerta('Producto agregado', false);

    this.newPurchase.medicineId = '';
    this.newPurchase.quantity = 0;
    this.medEncontrado = undefined;
  }

  guardarCompra() {

    if (this.tablaTemporal.length === 0) {
      this.mostrarAlerta('No hay productos en la lista', true);
      return;
    }

    if (!this.newPurchase.provider || !this.newPurchase.invoiceNumber) {
      this.mostrarAlerta('Complete datos de la compra', true);
      return;
    }

    this.tablaTemporal.forEach(item => {
      let m = this.listaMedicamentos.find(aux => aux.id === item.medicineId);

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

    this.tablaTemporal = [];
  }

  mostrarAlerta(msg: string, esError: boolean) {
    this.mensaje = msg;
    this.error = esError;

    clearTimeout(this.timeoutRef);

    this.timeoutRef = setTimeout(() => {
      this.mensaje = '';
    }, 2000);
  }

  cerrarAlerta() {
    this.mensaje = '';
  }

  obtenerNombre(id: string) { return this.listaMedicamentos.find(m => m.id === id)?.name || '---'; }
  obtenerLab(id: string) { return this.listaMedicamentos.find(m => m.id === id)?.laboratory || '---'; }
  obtenerDesc(id: string) { return this.listaMedicamentos.find(m => m.id === id)?.description || '---'; }

  regresar() {
    this.router.navigate(['/dashboard']);
  }
}
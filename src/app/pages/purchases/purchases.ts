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

  private medService = inject(MedicineService);
  private purchaseService = inject(PurchaseService);
  private router = inject(Router);

  // variables globales del componente
  tablaTemporal: any[] = [];
  listaMedicamentos: Medicine[] = [];
  medEncontrado?: Medicine;

  // modelo para el formulario
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
    // para tener los medicamentos actualizados
    this.medService.medicines$.subscribe(data => {
      this.listaMedicamentos = data;
    });
  }

  // busca los datos cuando se elige en el select
  buscarMed() {
    this.medEncontrado = this.listaMedicamentos.find(m => m.id === this.newPurchase.medicineId);

    if (this.medEncontrado) {
      this.newPurchase.purchasePrice = this.medEncontrado.purchasePrice;
      this.newPurchase.salePrice = this.medEncontrado.salePrice;
    }
  }

  // registro del boton + 
  meterALista() {

    const p = this.newPurchase;

    if (!p.provider && !p.invoiceNumber && !p.date) {
      this.mensaje = 'Complete los datos de la compra';
      this.error = true;
      return;
    }

    if (!p.provider || !p.invoiceNumber) {
      this.mensaje = 'Falta proveedor o factura';
      this.error = true;
      return;
    }

    if (!p.medicineId && p.quantity <= 0) {
      this.mensaje = 'Seleccione producto y cantidad';
      this.error = true;
      return;
    }

    if (!p.medicineId) {
      this.mensaje = 'Seleccione un medicamento';
      this.error = true;
      return;
    }

    if (p.quantity <= 0) {
      this.mensaje = 'Cantidad inválida';
      this.error = true;
      return;
    }

    if (p.purchasePrice < 0 || p.salePrice < 0) {
      this.mensaje = 'Precios no pueden ser negativos';
      this.error = true;
      return;
    }

    this.tablaTemporal.push({
      ...p
    });

    this.mensaje = 'Producto agregado';
    this.error = false;

    this.newPurchase.medicineId = '';
    this.newPurchase.quantity = 0;
    this.medEncontrado = undefined;
  }


  // procesa la compra y actualiza el inventario
  guardarCompra() {

    if (this.tablaTemporal.length === 0) {
      this.mensaje = 'No hay productos en la lista';
      this.error = true;
      return;
    }

    if (!this.newPurchase.provider || !this.newPurchase.invoiceNumber) {
      this.mensaje = 'Complete datos de la compra';
      this.error = true;
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

    this.mensaje = 'Compra registrada correctamente';
    this.error = false;

    this.tablaTemporal = [];
  }

  //  mostrar texto en la tabla
  obtenerNombre(id: string) { return this.listaMedicamentos.find(m => m.id === id)?.name || '---'; }
  obtenerLab(id: string) { return this.listaMedicamentos.find(m => m.id === id)?.laboratory || '---'; }
  obtenerDesc(id: string) { return this.listaMedicamentos.find(m => m.id === id)?.description || '---'; }

  regresar() {
    this.router.navigate(['/dashboard']);
  }
}
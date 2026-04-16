import { Component, inject } from '@angular/core';
import { SalesService } from '../../services/sales.service';
import { MedicineService } from '../../services/medicine.service';
import { Sale } from '../../models/sale';
import { Medicine } from '../../models/medicine';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales.html',
  styleUrl: './sales.css'
})
export class Sales {

  mensaje: string = '';
  error: boolean = false;


  private salesService = inject(SalesService);
  private medicineService = inject(MedicineService);

  sales$: Observable<Sale[]>;
  medicines: Medicine[] = [];
  filteredMedicines: any[] = [];
  cart: any[] = [];

  searchText: string = '';
  selectedMedicine?: any;

  customer = {
    name: '',
    idNumber: '',
    date: new Date().toISOString().split('T')[0]
  };

  newSaleItem = { quantity: 1 };

  constructor() {
    this.sales$ = this.salesService.sales$;
    this.medicineService.medicines$.subscribe(data => {
      this.medicines = data;
    });
  }

  // buscador
  onSearch() {
    if (this.searchText.length > 1) {
      this.filteredMedicines = this.medicines.map(m => {
        const enCarrito = this.cart
          .filter(item => item.id === m.id)
          .reduce((acc, item) => acc + item.cantVenta, 0);

        return { ...m, stockDisponible: m.stock - enCarrito };
      }).filter(m =>
        (m.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
          m.laboratory.toLowerCase().includes(this.searchText.toLowerCase())) &&
        m.stockDisponible > 0
      );
    } else {
      this.filteredMedicines = [];
    }
  }

  // seleccionar medicamento
  selectMed(med: any) {
    this.selectedMedicine = med;
    this.searchText = med.name;
    this.filteredMedicines = [];
  }

  // agregar al carrito
  addToCart() {

    this.mensaje = '';
    this.error = false;

    if (!this.selectedMedicine) {
      this.mensaje = 'Seleccione un producto';
      this.error = true;
      return;
    }

    if (this.newSaleItem.quantity <= 0) {
      this.mensaje = 'Cantidad inválida';
      this.error = true;
      return;
    }

    const stockReal = this.selectedMedicine.stockDisponible ?? this.selectedMedicine.stock;

    if (stockReal < this.newSaleItem.quantity) {
      this.mensaje = 'Stock insuficiente';
      this.error = true;
      return;
    }

    this.cart.push({
      ...this.selectedMedicine,
      cantVenta: this.newSaleItem.quantity,
      subtotal: this.selectedMedicine.salePrice * this.newSaleItem.quantity
    });

    this.mensaje = 'Producto agregado';
    this.error = false;

    this.selectedMedicine = undefined;
    this.searchText = '';
    this.newSaleItem.quantity = 1;
  }

  // total
  get totalCart() {
    return this.cart.reduce((acc, item) => acc + item.subtotal, 0);
  }

  // eliminar del carrito
  removeFromCart(index: number) {
    this.cart.splice(index, 1);
  }

  // completar venta
  completeSale() {

    if (this.cart.length === 0) {
      this.mensaje = 'No hay productos en la venta';
      this.error = true;
      return;
    }

    this.cart.forEach(item => {
      const medicineToUpdate = this.medicines.find(m => m.id === item.id);

      if (medicineToUpdate) {
        medicineToUpdate.stock -= item.cantVenta;

        const sale: Sale = {
          id: Date.now() + Math.random(),
          medicineId: medicineToUpdate.id,
          quantity: item.cantVenta,
          total: item.subtotal,
          date: new Date()
        };

        this.salesService.addSale(sale);
        this.medicineService.updateMedicine(medicineToUpdate);
      }
    });

    this.cart = [];
    this.searchText = '';
    this.filteredMedicines = [];

    this.mensaje = 'Venta realizada correctamente';
    this.error = false;
  }
}
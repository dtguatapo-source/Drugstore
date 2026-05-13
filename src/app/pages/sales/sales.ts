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

  newSaleItem = {
    quantity: 1
  };

  // para controlar las alertas
  private timeoutRef: any;

  constructor() {

    this.sales$ = this.salesService.sales$;

    this.medicineService.medicines$.subscribe(data => {
      this.medicines = data;
    });
  }

  // BUSCADOR
  //aqui se agrega codigo porque no nos salia el stock actualizado si se seleccionaba
  onSearch() {
    if (this.searchText.length > 1) {
      this.filteredMedicines = this.medicines
        .map(m => {
          const enCarrito = this.cart
            .filter(item => item.id === m.id)
            .reduce((acc, item) => acc + item.cantVenta, 0);

          // objeto con la resta hecha
          return {
            ...m,
            stockDisponible: m.stock - enCarrito
          };
        })
        .filter(m =>
          (m.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
            m.laboratory.toLowerCase().includes(this.searchText.toLowerCase()))
          && m.stockDisponible > 0 
        );
    } else {
      this.filteredMedicines = [];
    }
  }

  // seleccionar MEDICAMENTO
  selectMed(med: any) {
    this.selectedMedicine = med;
    this.searchText = med.name;
    this.filteredMedicines = [];
  }

  // al carro
  addToCart() {

    if (!this.selectedMedicine) {

      this.mostrarAlerta('Seleccione un producto', true);
      return;
    }

    if (this.newSaleItem.quantity <= 0) {

      this.mostrarAlerta('Cantidad inválida', true);
      return;
    }

    const stockReal =
      this.selectedMedicine.stockDisponible ??
      this.selectedMedicine.stock;

    if (stockReal < this.newSaleItem.quantity) {

      this.mostrarAlerta('Stock insuficiente', true);
      return;
    }

    this.cart.push({

      ...this.selectedMedicine,

      cantVenta: this.newSaleItem.quantity,

      subtotal:
        this.selectedMedicine.salePrice *
        this.newSaleItem.quantity
    });

    this.mostrarAlerta('Producto agregado correctamente', false);

    // limpiar formulario
    this.selectedMedicine = undefined;
    this.searchText = '';
    this.newSaleItem.quantity = 1;
  }

  // total del carro
  
  get totalCart() {

    return this.cart.reduce(
      (acc, item) => acc + item.subtotal,
      0
    );
  }

  // eliminar carro 
  removeFromCart(index: number) {

    this.cart.splice(index, 1);

    this.mostrarAlerta('Producto eliminado', false);
  }

  // completa venta
  completeSale() {

    if (this.cart.length === 0) {

      this.mostrarAlerta(
        'No hay productos en la venta',
        true
      );

      return;
    }

    this.cart.forEach(item => {

      const medicineToUpdate =
        this.medicines.find(m => m.id === item.id);

      if (medicineToUpdate) {

        // descontar stock
        medicineToUpdate.stock -= item.cantVenta;

        // crear venta
        const sale: Sale = {

          id: Date.now() + Math.random(),

          medicineId: medicineToUpdate.id,

          quantity: item.cantVenta,

          total: item.subtotal,

          date: new Date()
        };

        // guardar venta
        this.salesService.addSale(sale);

        // actualizar inventario
        this.medicineService.updateMedicine(
          medicineToUpdate
        );
      }
    });

    // limpiar todo
    this.cart = [];
    this.searchText = '';
    this.filteredMedicines = [];
    this.selectedMedicine = undefined;

    this.customer = {
      name: '',
      idNumber: '',
      date: new Date().toISOString().split('T')[0]
    };

    this.newSaleItem.quantity = 1;

    this.mostrarAlerta(
      'Venta realizada correctamente',
      false
    );
  }

  // alerta

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
}
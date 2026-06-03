import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { SalesService } from '../../services/sales.service';
import { MedicineService } from '../../services/medicine.service';
import { Sale } from '../../models/sale';
import { Medicine } from '../../models/medicine';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';

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
  private aiService = inject(AiService);
  private cdr = inject(ChangeDetectorRef);

  sales$: Observable<Sale[]>;

  medicines: Medicine[] = [];
  filteredMedicines: any[] = [];
  cart: any[] = [];

  searchText: string = '';
  selectedMedicine?: any;

  // IA CHAT
  iaQuery: string = '';

  chatMessages: any[] = [
    {
      sender: 'ia',
      text: ' Hola, soy tu asistente virtual de farmacia. ¿Cómo puedo ayudarte hoy?'
    }
  ];

  loadingIa: boolean = false;

  textIaOpen: boolean = false;

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

      this.medicines = data;
    });
  }

  // BUSCADOR
  onSearch() {

    if (this.searchText.length > 1) {

      this.filteredMedicines = this.medicines

        .map(m => {

          const enCarrito = this.cart

            .filter(item => item.id === m.id)

            .reduce(
              (acc, item) =>
                acc + item.cantVenta,
              0
            );

          return {

            ...m,

            stockDisponible:
              m.stock - enCarrito
          };
        })

        .filter(m =>

          (
            m.name.toLowerCase().includes(
              this.searchText.toLowerCase()
            )

            ||

            m.laboratory.toLowerCase().includes(
              this.searchText.toLowerCase()
            )

          )

          &&

          m.stockDisponible > 0
        );

    } else {

      this.filteredMedicines = [];
    }
  }

  // SELECCIONAR MEDICAMENTO
  selectMed(med: any) {

    this.selectedMedicine = med;

    this.searchText = med.name;

    this.filteredMedicines = [];
  }

  // AGREGAR AL CARRITO
  addToCart() {

    if (!this.selectedMedicine) {

      this.mostrarAlerta(
        'Seleccione un producto',
        true
      );

      return;
    }

    if (this.newSaleItem.quantity <= 0) {

      this.mostrarAlerta(
        'Cantidad inválida',
        true
      );

      return;
    }

    const stockReal =

      this.selectedMedicine.stockDisponible ??

      this.selectedMedicine.stock;

    if (stockReal < this.newSaleItem.quantity) {

      this.mostrarAlerta(
        'Stock insuficiente',
        true
      );

      return;
    }

    this.cart.push({

      ...this.selectedMedicine,

      cantVenta:
        this.newSaleItem.quantity,

      subtotal:
        this.selectedMedicine.salePrice *

        this.newSaleItem.quantity
    });

    this.mostrarAlerta(
      'Producto agregado correctamente',
      false
    );

    // limpiar formulario
    this.selectedMedicine = undefined;

    this.searchText = '';

    this.newSaleItem.quantity = 1;
  }

  // TOTAL CARRITO
  get totalCart() {

    return this.cart.reduce(

      (acc, item) =>
        acc + item.subtotal,

      0
    );
  }

  // ELIMINAR PRODUCTO
  removeFromCart(index: number) {

    this.cart.splice(index, 1);

    this.mostrarAlerta(
      'Producto eliminado',
      false
    );
  }

  // COMPLETAR VENTA
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

        this.medicines.find(
          m => m.id === item.id
        );

      if (medicineToUpdate) {

        medicineToUpdate.stock -=
          item.cantVenta;

        const sale: Sale = {

          id:
            Date.now() + Math.random(),

          medicineId:
            medicineToUpdate.id,

          quantity:
            item.cantVenta,

          total:
            item.subtotal,

          date:
            new Date()
        };

        this.salesService.addSale(sale);

        this.medicineService.updateMedicine(
          medicineToUpdate
        );
      }
    });

    // limpiar
    this.cart = [];

    this.searchText = '';

    this.filteredMedicines = [];

    this.selectedMedicine = undefined;

    this.customer = {

      name: '',

      idNumber: '',

      date:
        new Date()
          .toISOString()
          .split('T')[0]
    };

    this.newSaleItem.quantity = 1;

    this.mostrarAlerta(
      'Venta realizada correctamente',
      false
    );
  }

  // CHAT IA
  async consultarIA() {

    if (!this.iaQuery.trim()) {

      this.mostrarAlerta(
        'Por favor escribe un mensaje',
        true
      );

      return;
    }

    // MENSAJE USUARIO
    this.chatMessages.push({

      sender: 'user',

      text: this.iaQuery
    });

    this.loadingIa = true;

    this.cdr.detectChanges();

    try {

      const respuestaIA =

        await this.aiService
          .recomendarMedicamento(

            this.iaQuery,

            this.medicines
          );

      // RESPUESTA IA
      this.chatMessages.push({

        sender: 'ia',

        text: respuestaIA
      });

      // limpiar input
      this.iaQuery = '';

    } catch (e) {

      this.mostrarAlerta(
        'Ocurrio un error con la IA',
        true
      );

    } finally {

      this.loadingIa = false;

      this.cdr.detectChanges();
    }
  }

  // ALERTAS
  mostrarAlerta(
    msg: string,
    esError: boolean
  ) {

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
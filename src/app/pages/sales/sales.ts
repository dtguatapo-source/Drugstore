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

  // MIGRACIÓN ANGULAR 21: Estado derivado computed() para calcular el total
  readonly totalCart = computed(() => {
    return this.cart().reduce((acc, item) => acc + item.subtotal, 0);
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
            .reduce((acc, item) => acc + item.cantVenta, 0);

          return {
            ...m,
            stockDisponible: m.stock - enCarrito
          };
        })
        .filter(m =>
          (m.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
           m.laboratory.toLowerCase().includes(this.searchText.toLowerCase())) &&
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

    if (this.newSaleItem.quantity <= 0) {
      this.mostrarAlerta('Cantidad inválida', true);
      return;
    }

    const stockReal = med.stockDisponible ?? med.stock;

    if (stockReal < this.newSaleItem.quantity) {
      this.mostrarAlerta('Stock insuficiente', true);
      return;
    }

    this.cart.update(prev => [
      ...prev,
      {
        ...med,
        cantVenta: this.newSaleItem.quantity,
        subtotal: med.salePrice * this.newSaleItem.quantity
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

  // COMPLETAR VENTA
  completeSale(): void {
    if (this.cart().length === 0) {
      this.mostrarAlerta('No hay productos en la venta', true);
      return;
    }

    this.cart().forEach(item => {
      const medicineToUpdate = this.medicines().find(m => m.id === item.id);

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

    // Limpiar
    this.cart.set([]);
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
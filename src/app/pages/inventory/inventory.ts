import { Component, inject, signal, computed } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css' 
})
export class Inventory {
  private readonly servicio = inject(MedicineService);
  private readonly router = inject(Router);

  // Estados reactivos usando Signals de Angular 21
  readonly mensaje = signal<string>('');
  readonly error = signal<boolean>(false);
  readonly filtroTexto = signal<string>('');
  readonly listaCompleta = signal<Medicine[]>([]);

  // Estado derivado: se recalcula automáticamente cuando cambia listaCompleta o filtroTexto
  readonly listaFiltrada = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const medicamentos = this.listaCompleta();

    if (!texto) {
      return medicamentos;
    }

    return medicamentos.filter(m => 
      m.name.toLowerCase().includes(texto) || 
      m.id.toLowerCase().includes(texto)
    );
  });
  
  // Datos del formulario de nuevo medicamento
  newMedicine: Medicine = {
    id: '', name: '', laboratory: '', description: '',
    stock: 0, purchasePrice: 0, salePrice: 0
  };

  private timeoutRef: any;

  constructor() {
    this.servicio.medicines$.subscribe(datos => {
      this.listaCompleta.set(datos);
    });
  }

  generarId(): string {
    return 'MED-' + Math.floor(Math.random() * 500);
  }

  registrar(): void {
    const m = this.newMedicine;

    if (!m.name || !m.laboratory) {
      this.mostrarAlerta('Faltan datos obligatorios', true);
      return;
    }

    if (m.stock < 0 || m.purchasePrice < 0 || m.salePrice < 0) {
      this.mostrarAlerta('No se permiten valores negativos', true);
      return;
    }

    const existe = this.listaCompleta().some(x => 
      x.name.toLowerCase().trim() === m.name.toLowerCase().trim()
    );

    if (existe) {
      this.mostrarAlerta('Este medicamento ya esta registrado', true);
      return;
    }

    this.newMedicine.id = this.generarId();
    this.servicio.addMedicine({ ...this.newMedicine });

    this.mostrarAlerta('Guardado con exito', false);
    this.limpiar();
  }

  seleccionar(m: Medicine): void {
    this.newMedicine = { ...m };
  }

  actualizar(): void {
    const m = this.newMedicine;

    if (!this.newMedicine.id) {
      this.mostrarAlerta('Primero selecciona un producto', true);
      return;
    }

    if (m.stock < 0 || m.purchasePrice < 0 || m.salePrice < 0) {
      this.mostrarAlerta('No se permiten valores negativos', true);
      return;
    }

    this.servicio.updateMedicine({ ...this.newMedicine });

    this.mostrarAlerta('Actualizado con exito', false);
    this.limpiar();
  }

  borrar(): void {
    if (!this.newMedicine.id) {
      this.mostrarAlerta('Selecciona algo para borrar', true);
      return;
    }

    if (confirm('¿Seguro que quieres eliminarlo?')) {
      this.servicio.deleteMedicine(this.newMedicine.id);
      this.mostrarAlerta('Eliminado con exito', false);
      this.limpiar();
    }
  }

  buscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filtroTexto.set(input.value);
  }

  limpiar(): void {
    this.newMedicine = {
      id: '', name: '', laboratory: '', description: '',
      stock: 0, purchasePrice: 0, salePrice: 0
    };
  }

  irAlMenu(): void {
    this.router.navigate(['/dashboard']);
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
}
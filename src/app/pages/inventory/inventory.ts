import { Component, inject } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine';
import { NgFor, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [NgFor, FormsModule, CommonModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css' 
})
export class Inventory {
  
  mensaje: string = '';
  error: boolean = false;
  
  private servicio = inject(MedicineService);
  private router = inject(Router);

  // listas para mostrar y para filtrar
  listaMeds: Medicine[] = [];
  listaCompleta: Medicine[] = [];
  
  // datos del formulario
  newMedicine: Medicine = {
    id: '', name: '', laboratory: '', description: '',
    stock: 0, purchasePrice: 0, salePrice: 0
  };

  // para controlar que no se pisen las alertas
  private timeoutRef: any;

  constructor() {
    this.servicio.medicines$.subscribe(datos => {
      this.listaCompleta = datos;
      this.listaMeds = datos;
    });
  }

  generarId() {
    return 'MED-' + Math.floor(Math.random() * 500);
  }

  registrar() {
    const m = this.newMedicine;

    if (!m.name || !m.laboratory) {
      this.mostrarAlerta('Faltan datos obligatorios', true);
      return;
    }

    if (m.stock < 0 || m.purchasePrice < 0 || m.salePrice < 0) {
      this.mostrarAlerta('No se permiten valores negativos', true);
      return;
    }

    const existe = this.listaCompleta.some(x => 
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

  seleccionar(m: Medicine) {
    this.newMedicine = { ...m };
  }

  actualizar() {
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

  borrar() {
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

  buscar(event: any) {
    const texto = event.target.value.toLowerCase().trim();

    if (!texto) {
      this.listaMeds = [...this.listaCompleta];
    } else {
      this.listaMeds = this.listaCompleta.filter(m => 
        m.name.toLowerCase().includes(texto) || 
        m.id.toLowerCase().includes(texto)
      );
    }
  }

  limpiar() {
    this.newMedicine = {
      id: '', name: '', laboratory: '', description: '',
      stock: 0, purchasePrice: 0, salePrice: 0
    };
  }

  irAlMenu() {
    this.router.navigate(['/dashboard']);
  }

  // funcion para mostrar alertas bonitas en el centro
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
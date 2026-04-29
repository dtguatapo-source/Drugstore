import { Component, inject } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine';
import { NgFor, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [ NgFor, FormsModule, CommonModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css' 
})
export class Inventory {
  
  mensaje: string = '';
  error: boolean = false;
  
  private servicio = inject(MedicineService);
  private router = inject(Router);

  // Arreglos para la tabla y el buscador
  listaMeds: Medicine[] = [];
  listaCompleta: Medicine[] = [];
  
  // Para el formulario
  newMedicine: Medicine = {
    id: '', name: '', laboratory: '', description: '',
    stock: 0, purchasePrice: 0, salePrice: 0
  };

  constructor() {
    // Traer datos del servicio al iniciar
    this.servicio.medicines$.subscribe(datos => {
      this.listaCompleta = datos;
      this.listaMeds = datos;
    });
  }

  // Id aleatorio para el producto
  generarId() {
    return 'MED-' + Math.floor(Math.random() * 500);
  }

  // Guardar un nuevo medicamento
  registrar() {
    const m = this.newMedicine;

    // Que no manden campos vacios
    if (!m.name || !m.laboratory) {
      this.mensaje = 'Faltan datos obligatorios';
      this.error = true;
      return;
    }

    // No dejar meter numeros negativos
    if (m.stock < 0 || m.purchasePrice < 0 || m.salePrice < 0) {
      this.mensaje = 'No se permiten valores negativos';
      this.error = true;
      return;
    }

    // Validar si el nombre ya esta repetido (Duplicados)
    const existe = this.listaCompleta.some(x => 
      x.name.toLowerCase().trim() === m.name.toLowerCase().trim()
    );

    if (existe) {
      this.mensaje = 'Este medicamento ya esta registrado';
      this.error = true;
      return;
    }

    // Si todo esta bien, se guarda
    this.newMedicine.id = this.generarId();
    this.servicio.addMedicine({ ...this.newMedicine });
    this.mensaje = 'Guardado con exito';
    this.error = false;
    this.limpiar();
  }

  // Subir los datos al formulario al hacer clic
  seleccionar(m: Medicine) {
    this.newMedicine = { ...m };
  }

  // Cambiar datos de un producto ya existente
  actualizar() {
    const m = this.newMedicine;
    if (!this.newMedicine.id) {
      this.mensaje = 'Primero selecciona un producto';
      this.error = true;
      return;
    }
    // No dejar meter numeros negativos
    if (m.stock < 0 || m.purchasePrice < 0 || m.salePrice < 0) {
      this.mensaje = 'No se permiten valores negativos';
      this.error = true;
      return;
    }

    this.servicio.updateMedicine({ ...this.newMedicine });
    this.mensaje = 'Actualizado con exito';
    this.error = false;
    this.limpiar();
  }

  // Borrar un producto de la lista
  borrar() {
    if (!this.newMedicine.id) {
      this.mensaje = 'Selecciona algo para borrar';
      this.error = true;
      return;
    }
    if (confirm('¿Seguro que quieres eliminarlo?')) {
      this.servicio.deleteMedicine(this.newMedicine.id);
      this.mensaje = 'Eliminado con exito';
      this.error = false;
      this.limpiar();
    }
  }

  // Filtro para buscar en la tabla
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

  // Dejar los cuadritos en blanco
  limpiar() {
    this.newMedicine = {
      id: '', name: '', laboratory: '', description: '',
      stock: 0, purchasePrice: 0, salePrice: 0
    };
  }

  // Volver a la pantalla principal
  irAlMenu() {
    this.router.navigate(['/dashboard']);
  }
}
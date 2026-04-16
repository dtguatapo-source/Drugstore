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
  // llamamos al servicio y al router
  private servicio = inject(MedicineService);
  private router = inject(Router);

  // lista que se muestra en la tabla
  listaMeds: Medicine[] = [];
  
  // objeto para limpiar o llenar el formulario
  newMedicine: Medicine = {
    id: '',
    name: '',
    laboratory: '',
    description: '',
    stock: 0,
    purchasePrice: 0,
    salePrice: 0
  };

  constructor() {
    // nos traemos los datos del servicio apenas cargue la pagina
    this.servicio.medicines$.subscribe(datos => {
      this.listaMeds = datos;
    });
  }

  // genera un codigo aleatorio para el producto
  generarId() {
    return 'MED-' + Math.floor(Math.random() * 500);
  }

  // Registrar
registrar() {

  const m = this.newMedicine;

  // validaciones
  if (!m.name && !m.laboratory) {
    this.mensaje = 'Campos vacíos';
    this.error = true;
    return;
  }

  if (!m.name || !m.laboratory) {
    this.mensaje = 'Complete los campos obligatorios';
    this.error = true;
    return;
  }

  if (m.stock < 0 || m.purchasePrice < 0 || m.salePrice < 0) {
    this.mensaje = 'Valores no pueden ser negativos';
    this.error = true;
    return;
  }

  // evitar duplicados
  const existe = this.listaMeds.some(x => x.name.toLowerCase() === m.name.toLowerCase());
  if (existe) {
    this.mensaje = 'El medicamento ya existe';
    this.error = true;
    return;
  }

  // guardar
  this.newMedicine.id = this.generarId();
  this.servicio.addMedicine({ ...this.newMedicine });

  this.mensaje = 'Guardado con éxito';
  this.error = false;

  this.limpiar();
}


  // cuando se hace clic en la fila de la tabla
  seleccionar(m: Medicine) {
    this.newMedicine = { ...m };
  }

//actualizar
actualizar() {

  if (!this.newMedicine.id) {
    this.mensaje = 'Seleccione un producto';
    this.error = true;
    return;
  }

  this.servicio.updateMedicine({ ...this.newMedicine });

  this.mensaje = 'Actualizado correctamente';
  this.error = false;

  this.limpiar();
}

  // este es el del boton Eliminar
  borrar() {
    if (this.newMedicine.id) {
      if (confirm('¿Desea borrar este medicamento?')) {
        this.servicio.deleteMedicine(this.newMedicine.id);
        this.limpiar();
      }
    } else {
      alert('Primero seleccione un producto de la tabla');
    }
  }

  // para el buscador
  buscar(event: any) {
    const texto = event.target.value.toLowerCase();
    this.servicio.medicines$.subscribe(todos => {
      this.listaMeds = todos.filter(m => 
        m.name.toLowerCase().includes(texto) || 
        m.id.toLowerCase().includes(texto)
      );
    });
  }

  // limpia los cuadros de texto
  limpiar() {
    this.newMedicine = {
      id: '',
      name: '',
      laboratory: '',
      description: '',
      stock: 0,
      purchasePrice: 0,
      salePrice: 0
    };
  }

  // boton Salir
  irAlMenu() {
    this.router.navigate(['/dashboard']);
  }
}
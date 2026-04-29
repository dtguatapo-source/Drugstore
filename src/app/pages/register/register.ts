import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Importante para capturar lo que escribes
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule], // Los agregamos aquí para que funcionen
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  // Variables para el formulario
  nuevoUsuario: string = '';
  nuevaPass: string = '';
  confirmarPass: string = '';

  // Variables para manejar errores
  error: boolean = false;
  mensaje: string = '';

  constructor(private router: Router) {}

  registrar() {
    // Validamos que no dejen nada vacío
    if (!this.nuevoUsuario.trim() || !this.nuevaPass.trim() || !this.confirmarPass.trim()) {
      this.mensaje = 'Por favor completa todos los campos';
      this.error = true;
      return;
    }

    // Validamos que las contraseñas coincidan
    if (this.nuevaPass !== this.confirmarPass) {
      this.mensaje = 'Las contraseñas no coinciden';
      this.error = true;
      return;
    }

    // 1. Buscamos si ya hay usuarios guardados en el navegador
    const datosLocal = localStorage.getItem('usuarios_sistema');
    let usuarios = datosLocal ? JSON.parse(datosLocal) : [];

    // 2. Revisamos que el nombre no esté ocupado
    const existe = usuarios.find((u: any) => u.username === this.nuevoUsuario);
    if (existe) {
      this.mensaje = 'Este usuario ya está registrado';
      this.error = true;
      return;
    }

    // 3. Guardamos el nuevo usuario en el arreglo
    usuarios.push({
      username: this.nuevoUsuario,
      password: this.nuevaPass
    });

    // 4. Guardamos el arreglo actualizado en el LocalStorage
    localStorage.setItem('usuarios_sistema', JSON.stringify(usuarios));

    // Si todo sale bien, avisamos y mandamos al login
    alert('¡Registro exitoso! Ya puedes iniciar sesión.');
    this.router.navigate(['/login']);
  }

  // Función por si quieren cancelar y volver
  volverAlLogin() {
    this.router.navigate(['/login']);
  }
}
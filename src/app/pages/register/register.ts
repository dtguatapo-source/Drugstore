import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Importante para capturar lo que escribes
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  nuevoUsuario: string = '';
  nuevaPass: string = '';
  confirmarPass: string = '';

  error: boolean = false;
  mensaje: string = '';

  constructor(private router: Router) {}

  registrar() {
    if (!this.nuevoUsuario.trim() || !this.nuevaPass.trim() || !this.confirmarPass.trim()) {
      this.mensaje = 'Por favor completa todos los campos';
      this.error = true;
      return;
    }

    if (this.nuevaPass !== this.confirmarPass) {
      this.mensaje = 'Las contraseñas no coinciden';
      this.error = true;
      return;
    }

    const datosLocal = localStorage.getItem('usuarios_sistema');
    let usuarios = datosLocal ? JSON.parse(datosLocal) : [];

    const existe = usuarios.find((u: any) => u.username === this.nuevoUsuario);
    if (existe) {
      this.mensaje = 'Este usuario ya está registrado';
      this.error = true;
      return;
    }

    usuarios.push({
      username: this.nuevoUsuario,
      password: this.nuevaPass
    });

    localStorage.setItem('usuarios_sistema', JSON.stringify(usuarios));

    alert('¡Registro exitoso! Ya puedes iniciar sesión.');
    this.router.navigate(['/login']);
  }

  volverAlLogin() {
    this.router.navigate(['/login']);
  }
}
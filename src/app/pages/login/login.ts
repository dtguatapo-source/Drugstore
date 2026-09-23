import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule], 
  templateUrl: './login.html',
  styleUrl: './login.css' 
})
export class Login {

  username: string = '';
  password: string = '';

  // Inyección moderna de dependencias según la guía
  private readonly router = inject(Router);

  // Estados manejados con Signals de Angular 21
  readonly error = signal<boolean>(false);
  readonly intento = signal<boolean>(false);
  readonly mensaje = signal<string>('');

  login(): void {
    this.intento.set(true);
    const user = this.username.trim();
    const pass = this.password.trim();

    // Validaciones básicas
    if (!user || !pass) {
      this.mensaje.set('Complete todos los campos');
      this.error.set(true);
      return;
    }

    // --- PASO 1: Revisar si es el Administrador predeterminado ---
    if (user === 'admin' && pass === '1234') {
      this.entrarAlSistema();
      return;
    }

    // --- PASO 2: Buscar en los usuarios registrados (LocalStorage) ---
    const datosLocal = localStorage.getItem('usuarios_sistema');
    const usuariosRegistrados = datosLocal ? JSON.parse(datosLocal) : [];

    // Buscamos si existe alguien con ese nombre y esa clave
    const usuarioValido = usuariosRegistrados.find((u: any) => u.username === user && u.password === pass);

    if (usuarioValido) {
      this.entrarAlSistema();
    } else {
      // Si no es admin y no está en la lista...
      this.mensaje.set('Usuario o contraseña incorrectos');
      this.error.set(true);
    }
  }

  entrarAlSistema(): void {
    this.error.set(false);
    this.mensaje.set('');
    localStorage.setItem('login', 'true'); // Guardamos la sesión
    this.router.navigate(['/dashboard']);
  }

  irARegistro(): void {
    this.router.navigate(['/register']);
  }
}
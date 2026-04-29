import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './login.html',
  styleUrl: './login.css' 
})
export class Login {

  username: string = '';
  password: string = '';

  error: boolean = false;
  intento: boolean = false;
  mensaje: string = '';

  constructor(private router: Router) {}

  login() {
    this.intento = true;
    const user = this.username.trim();
    const pass = this.password.trim();

    // Validaciones básicas
    if (!user || !pass) {
      this.mensaje = 'Complete todos los campos';
      this.error = true;
      return;
    }

    // --- PASO 1: Revisar si es el Administrador predeterminado ---
    if (user === 'admin' && pass === '1234') {
      this.entrarAlSistema();
      return;
    }

    // --- PASO 2: Buscar en los usuarios registrados (LocalStorage) ---
    // Obtenemos la lista que guardamos en el modulo de registro
    const datosLocal = localStorage.getItem('usuarios_sistema');
    const usuariosRegistrados = datosLocal ? JSON.parse(datosLocal) : [];

    // Buscamos si existe alguien con ese nombre y esa clave
    const usuarioValido = usuariosRegistrados.find((u: any) => u.username === user && u.password === pass);

    if (usuarioValido) {
      this.entrarAlSistema();
    } else {
      // Si no es admin y no está en la lista...
      this.mensaje = 'Usuario o contraseña incorrectos';
      this.error = true;
    }
  }

  // Función para no repetir código
  entrarAlSistema() {
    this.error = false;
    this.mensaje = '';
    localStorage.setItem('login', 'true'); // Guardamos la sesión
    this.router.navigate(['/dashboard']);
  }

  // Función para que el link del HTML nos mande al registro
  irARegistro() {
    this.router.navigate(['/register']);
  }
}
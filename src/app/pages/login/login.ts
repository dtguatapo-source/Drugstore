import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // 👈 1. Importamos HttpClient

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

  // Inyección de dependencias
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient); // 👈 2. Inyectamos el servicio HTTP

  // Estados manejados con Signals
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

    // 👈 3. Petición POST directa al Backend (puerto 3000)
    this.http.post<any>('http://localhost:3000/auth/login', {
      username: user,
      password: pass
    }).subscribe({
      next: (res) => {
        // Éxito: el backend respondió 200 OK y nos entregó el token y usuario
        this.entrarAlSistema(res);
      },
      error: (err) => {
        // Error: el backend devolvió 401 (credenciales incorrectas) o no hay conexión
        console.error('Error en login:', err);
        if (err.status === 0) {
          this.mensaje.set('No se pudo conectar con el servidor (backend apagado o error de CORS)');
        } else {
          this.mensaje.set('Usuario o contraseña incorrectos');
        }
        this.error.set(true);
      }
    });
  }

  entrarAlSistema(res: any): void {
    this.error.set(false);
    this.mensaje.set('');

    // Guardamos la sesión y el token JWT devuelto por el backend
    localStorage.setItem('login', 'true');
    localStorage.setItem('token', res.access_token);
    if (res.user) {
      localStorage.setItem('user', JSON.stringify(res.user));
    }

    // Redirigimos al panel principal
    this.router.navigate(['/dashboard']);
  }

  irARegistro(): void {
    this.router.navigate(['/register']);
  }
}
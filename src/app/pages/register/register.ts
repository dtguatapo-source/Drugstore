import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // 👈 1. Importamos HttpClient para conectar con el backend

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule], 
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  nuevoUsuario: string = '';
  nuevaPass: string = '';
  confirmarPass: string = '';

  // Inyecciones de dependencias
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient); // 👈 2. Inyectamos HttpClient aquí

  // Gestión de estado con Signals
  readonly error = signal<boolean>(false);
  readonly mensaje = signal<string>('');

  registrar(): void {
    // Validaciones del lado del cliente
    if (!this.nuevoUsuario.trim() || !this.nuevaPass.trim() || !this.confirmarPass.trim()) {
      this.mensaje.set('Por favor completa todos los campos');
      this.error.set(true);
      return;
    }

    if (this.nuevaPass !== this.confirmarPass) {
      this.mensaje.set('Las contraseñas no coinciden');
      this.error.set(true);
      return;
    }

    // 👈 3. Reemplazamos el LocalStorage y enviamos los datos a NestJS (puerto 3000)
    // Tu backend espera: username, password y confirmPassword
    const datosRegistro = {
      username: this.nuevoUsuario.trim(),
      password: this.nuevaPass.trim(),
      confirmPassword: this.confirmarPass.trim(),
    };

    this.http.post<any>('http://localhost:3000/users', datosRegistro).subscribe({
      next: (res) => {
        // 👈 Éxito: el backend guardó el usuario en PostgreSQL a través de Prisma
        console.log('Usuario registrado con éxito:', res);
        alert('¡Registro exitoso! Ya puedes iniciar sesión.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        // 👈 Manejo de errores que envía tu backend
        console.error('Error al registrar:', err);
        
        if (err.status === 409) {
          // Tu backend lanza ConflictException: 'El nombre de usuario ya está registrado'
          this.mensaje.set('El nombre de usuario ya está registrado');
        } else if (err.status === 400) {
          // Tu backend valida coincidencia o longitud mínima (por ejemplo si exige 8 caracteres)
          const msg = err.error?.message;
          this.mensaje.set(Array.isArray(msg) ? msg.join(', ') : (msg || 'Datos de registro inválidos'));
        } else if (err.status === 0) {
          this.mensaje.set('No se pudo conectar con el servidor backend');
        } else {
          this.mensaje.set('Ocurrió un error inesperado al registrar');
        }

        this.error.set(true);
      }
    });
  }

  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}
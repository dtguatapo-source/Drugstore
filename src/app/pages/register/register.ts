import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  // MIGRACIÓN ANGULAR 21: Se elimina CommonModule ya que no es necesario con el nuevo control flow
  imports: [FormsModule], 
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  nuevoUsuario: string = '';
  nuevaPass: string = '';
  confirmarPass: string = '';

  // MIGRACIÓN ANGULAR 21: Inyección moderna de dependencias usando inject() en lugar del constructor
  private readonly router = inject(Router);

  // MIGRACIÓN ANGULAR 21: Gestión de estado reactivo mediante Signals en reemplazo de variables tradicionales
  readonly error = signal<boolean>(false);
  readonly mensaje = signal<string>('');

  registrar(): void {
    if (!this.nuevoUsuario.trim() || !this.nuevaPass.trim() || !this.confirmarPass.trim()) {
      // MIGRACIÓN ANGULAR 21: Actualización del estado usando .set() en la signal
      this.mensaje.set('Por favor completa todos los campos');
      this.error.set(true);
      return;
    }

    if (this.nuevaPass !== this.confirmarPass) {
      this.mensaje.set('Las contraseñas no coinciden');
      this.error.set(true);
      return;
    }

    const datosLocal = localStorage.getItem('usuarios_sistema');
    let usuarios = datosLocal ? JSON.parse(datosLocal) : [];

    const existe = usuarios.find((u: any) => u.username === this.nuevoUsuario);
    if (existe) {
      this.mensaje.set('Este usuario ya está registrado');
      this.error.set(true);
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

  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}
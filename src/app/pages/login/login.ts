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

    if (!user && !pass) {
      this.mensaje = 'Campos vacíos';
      this.error = true;
      return;
    }

    if (!user || !pass) {
      this.mensaje = 'Complete todos los campos';
      this.error = true;
      return;
    }

    if (user === 'admin' && pass === '1234') {

      this.error = false;
      this.mensaje = '';
      localStorage.setItem('login', 'true'); 
      this.router.navigate(['/dashboard']);

    } else {

      this.mensaje = 'Usuario o contraseña incorrectos';
      this.error = true;
    }
  }
}
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

  // variables para guardar lo que escribe el usuario
  username: string = '';
  password: string = '';

  // variable para mostrar error si falla
  error: boolean = false;

  constructor(private router: Router) {}

  // funcion que se ejecuta al iniciar sesion
  login() {

    // validacion basica de usuario y contraseña
    if (this.username === 'admin' && this.password === '1234') {

      // si es correcto entra al sistema
      this.error = false;
      this.router.navigate(['/dashboard']);

    } else {

      // si no es correcto muestra error
      this.error = true;
    }
  }
}
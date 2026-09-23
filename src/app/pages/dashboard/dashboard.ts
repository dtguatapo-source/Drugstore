
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  private readonly router = inject(Router);

  // Estado reactivo usando Signals según la guía de Angular 21
  readonly isLoggedIn = signal<boolean>(!!localStorage.getItem('login'));

  constructor() {
    // Si no hay sesión activa, redirige al login
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  salir(): void {
    localStorage.removeItem('login');
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }
}
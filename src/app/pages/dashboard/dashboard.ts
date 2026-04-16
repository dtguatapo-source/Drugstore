import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink], 
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css' 
})
export class Dashboard implements OnInit {

  private router = inject(Router);

  ngOnInit() {

    // validar si esta logueado
    const login = localStorage.getItem('login');

    if (!login) {
      this.router.navigate(['/login']);
    }
  }

  salir() {

    // eliminar sesion
    localStorage.removeItem('login');

    this.router.navigate(['/login']); 
  }
}
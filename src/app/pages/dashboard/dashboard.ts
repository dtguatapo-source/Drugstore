import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink], 
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css' 
})
export class Dashboard {

  // router para poder cambiar de pagina
  private router = inject(Router);

  // funcion para salir
  salir() {

    // volver al login
    this.router.navigate(['/login']); 
  }
}
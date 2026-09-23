import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {

  protected readonly title = signal('drugstore-system');

  // MIGRACIÓN ANGULAR 21: Inyección móderna mediante inject() en lugar del constructor
  private readonly router = inject(Router);

  // MIGRACIÓN ANGULAR 21: Manejo del estado del layout mediante una Signal reactiva
  readonly mostrarLayout = signal<boolean>(false);

  private readonly rutasSinMenu = ['/login', '/dashboard', '/register'];

  constructor() {
    // Validar ruta inicial
    this.validarRuta(this.router.url);

    // Escuchar eventos de navegación
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.validarRuta(event.urlAfterRedirects);
    });
  }

  validarRuta(url: string): void {
    const esRutaSinMenu = this.rutasSinMenu.some(ruta => url.startsWith(ruta));
    // MIGRACIÓN ANGULAR 21: Actualización de la signal usando .set()
    this.mostrarLayout.set(!esRutaSinMenu);
  }

  salir(): void {
    // Eliminar sesión
    localStorage.removeItem('login');
    this.router.navigate(['/login']);
  }
}
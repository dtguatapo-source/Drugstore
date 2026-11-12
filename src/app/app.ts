import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { limpiarSesion, rolDeSesion } from './pages/auth.guard/auth.guard';

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

  // Rol real tomado del JWT: la UI muestra solo lo que el backend va a permitir
  readonly rol = signal<string | null>(rolDeSesion());
  readonly esAdmin = computed(() => this.rol() === 'ADMIN');
  readonly etiquetaRol = computed(() => {
    const rol = this.rol();
    if (rol === 'ADMIN') return 'Admin';
    if (rol === 'USER') return 'Cajero';
    return 'Usuario';
  });

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
    // El token puede cambiar entre navegaciones (login, logout, vencimiento)
    this.rol.set(rolDeSesion());
  }

  salir(): void {
    // Eliminar la sesión completa: login, token y usuario
    limpiarSesion();
    this.router.navigate(['/login']);
  }
}
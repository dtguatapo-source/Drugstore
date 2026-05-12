import { Component, signal } from '@angular/core';
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

  mostrarLayout = false;

  rutasSinMenu = ['/login', '/dashboard', '/register'];

  constructor(private router: Router) {

    this.validarRuta(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.validarRuta(event.urlAfterRedirects);
    });
  }

  validarRuta(url: string) {
    this.mostrarLayout = !this.rutasSinMenu.some(ruta =>
      url.startsWith(ruta)
    );
  }
}
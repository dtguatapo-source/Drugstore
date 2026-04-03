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

  // título básico de la app (lo dejo así por ahora)
  protected readonly title = signal('drugstore-system');

  // variable para saber si se muestra el menú o no
  // la dejo en false para que no se vea raro cuando carga el login
  mostrarLayout = false; 

  constructor(private router: Router) {

    // aquí estoy escuchando cuando cambia la ruta
    // (cada vez que navego a otra página)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {

      // estas son las rutas donde NO quiero que salga el menú
      // ejemplo: login o pantalla principal
      const rutasSinMenu = ['/login', '/dashboard', '/']; 
      
      // si la ruta actual NO está en esa lista, entonces sí muestro el layout
      // si está, entonces no lo muestro
      this.mostrarLayout = !rutasSinMenu.includes(event.urlAfterRedirects);
    });
  }
}
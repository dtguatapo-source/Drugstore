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

  // titulo de la app por ahora
  protected readonly title = signal('drugstore-system');

  // variable para mostrar o no el menu
  // inicia en falso para que no salga en el login
  mostrarLayout = false; 

  constructor(private router: Router) {

    // aqui escucho cuando cambia la ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {

      // rutas donde no quiero mostrar el menu
      const rutasSinMenu = ['/login', '/dashboard', '/register']; 
      
      // si la ruta no esta en la lista se muestra el menu
      this.mostrarLayout = !rutasSinMenu.includes(event.urlAfterRedirects);
    });
  }
}
import { Component, input, output } from '@angular/core';

/**
 * Componente presentacional que avisa si una carga está en curso o si falló.
 * No conoce servicios: recibe el estado y emite la intención de reintentar.
 */
@Component({
  selector: 'app-estado-carga',
  standalone: true,
  imports: [],
  templateUrl: './estado-carga.html',
  styleUrl: './estado-carga.css'
})
export class EstadoCarga {
  readonly cargando = input<boolean>(false);
  readonly error = input<string>('');

  readonly reintentar = output<void>();
}

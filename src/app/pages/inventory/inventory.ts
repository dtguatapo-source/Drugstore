import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EstadoCarga } from '../../shared/estado-carga/estado-carga';
import { mensajeDeError } from '../../shared/mensaje-error';

/**
 * Deriva el próximo id a partir del catálogo ya cargado.
 *
 * Antes el id salía de `Math.random()`, así que dos medicamentos podían chocar
 * y el backend contestaba 409. Ahora se toma el mayor número final, se le suma
 * uno y se conserva el relleno de ceros (MED-007 -> MED-008). Los ids sin
 * dígitos se ignoran porque no aportan ningún número que comparar.
 */
export function siguienteIdMedicina(ids: readonly string[]): string {
  let mayor = 0;
  let ancho = 3;

  for (const id of ids) {
    const coincidencia = /(\d+)\s*$/.exec(id ?? '');

    if (!coincidencia) {
      continue;
    }

    const numero = Number(coincidencia[1]);

    if (!Number.isFinite(numero)) {
      continue;
    }

    mayor = Math.max(mayor, numero);
    ancho = Math.max(ancho, coincidencia[1].length);
  }

  return 'MED-' + String(mayor + 1).padStart(ancho, '0');
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule, EstadoCarga],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css' 
})
export class Inventory {
  private readonly servicio = inject(MedicineService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Estados reactivos usando Signals de Angular 21
  readonly mensaje = signal<string>('');
  readonly error = signal<boolean>(false);
  readonly filtroTexto = signal<string>('');
  readonly listaCompleta = signal<Medicine[]>([]);

  // Se enciende mientras una escritura está en vuelo: bloquea dobles envíos
  readonly guardando = signal<boolean>(false);

  // Estado de la carga del inventario (S7): sin backend la tabla se ve vacía,
  // pero la pantalla avisa y ofrece reintentar
  readonly cargando = toSignal(this.servicio.cargando$, { initialValue: false });
  readonly errorCarga = toSignal(this.servicio.errorCarga$, { initialValue: '' });

  // Estado derivado: se recalcula automáticamente cuando cambia listaCompleta o filtroTexto
  readonly listaFiltrada = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const medicamentos = this.listaCompleta();

    if (!texto) {
      return medicamentos;
    }

    return medicamentos.filter(m => 
      m.name.toLowerCase().includes(texto) || 
      m.id.toLowerCase().includes(texto)
    );
  });
  
  // Datos del formulario de nuevo medicamento
  newMedicine: Medicine = {
    id: '', name: '', laboratory: '', description: '',
    stock: 0, purchasePrice: 0, salePrice: 0
  };

  private timeoutRef?: ReturnType<typeof setTimeout>;

  constructor() {
    //  takeUntilDestroyed corta la suscripción al destruir el componente
    this.servicio.medicines$
      .pipe(takeUntilDestroyed())
      .subscribe(datos => {
        this.listaCompleta.set(datos);
      });

    //  El aviso temporal tampoco debe sobrevivir al componente
    this.destroyRef.onDestroy(() => clearTimeout(this.timeoutRef));
  }

  // Vuelve a pedir el inventario a PostgreSQL
  reintentar(): void {
    this.servicio.loadMedicines();
  }

  registrar(): void {
    if (this.guardando()) {
      return; //  Doble clic: la primera petición sigue en vuelo
    }

    const m = this.newMedicine;
    const errorValidacion = this.validarMedicamento(m);

    if (errorValidacion) {
      this.mostrarAlerta(errorValidacion, true);
      return;
    }

    const nombre = m.name.trim();
    const existe = this.listaCompleta().some(x => 
      x.name.trim().toLowerCase() === nombre.toLowerCase()
    );

    if (existe) {
      this.mostrarAlerta('Este medicamento ya está registrado', true);
      return;
    }

    const nuevo: Medicine = {
      ...m,
      id: siguienteIdMedicina(this.listaCompleta().map(x => x.id)),
      name: nombre,
      laboratory: m.laboratory.trim()
    };

    this.guardando.set(true);
    this.servicio.addMedicine(nuevo).subscribe({
      //  El éxito se anuncia solo cuando el backend confirmó el guardado
      next: () => {
        this.guardando.set(false);
        this.mostrarAlerta('Guardado con éxito', false);
        this.limpiar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarAlerta(
          this.mensajeDeErrorEscritura(err, 'No se pudo registrar el medicamento.'),
          true
        );
      }
    });
  }

  seleccionar(m: Medicine): void {
    this.newMedicine = { ...m };
  }

  actualizar(): void {
    if (this.guardando()) {
      return;
    }

    const m = this.newMedicine;

    if (!m.id) {
      this.mostrarAlerta('Primero selecciona un producto', true);
      return;
    }

    const errorValidacion = this.validarMedicamento(m);

    if (errorValidacion) {
      this.mostrarAlerta(errorValidacion, true);
      return;
    }

    const editado: Medicine = {
      ...m,
      name: m.name.trim(),
      laboratory: m.laboratory.trim()
    };

    this.guardando.set(true);
    this.servicio.updateMedicine(editado).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarAlerta('Actualizado con éxito', false);
        this.limpiar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarAlerta(
          this.mensajeDeErrorEscritura(err, 'No se pudo actualizar el medicamento.'),
          true
        );
      }
    });
  }

  borrar(): void {
    if (this.guardando()) {
      return;
    }

    if (!this.newMedicine.id) {
      this.mostrarAlerta('Selecciona un medicamento para borrar', true);
      return;
    }

    if (!confirm('¿Seguro que quieres eliminarlo?')) {
      return;
    }

    this.guardando.set(true);
    this.servicio.deleteMedicine(this.newMedicine.id).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarAlerta('Eliminado con éxito', false);
        this.limpiar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarAlerta(
          mensajeDeError(
            err,
            'No se pudo eliminar el medicamento (verifique que no tenga compras o ventas asociadas).'
          ),
          true
        );
      }
    });
  }

  buscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filtroTexto.set(input.value);
  }

  limpiar(): void {
    this.newMedicine = {
      id: '', name: '', laboratory: '', description: '',
      stock: 0, purchasePrice: 0, salePrice: 0
    };
  }

  irAlMenu(): void {
    this.router.navigate(['/dashboard']);
  }

  mostrarAlerta(msg: string, esError: boolean): void {
    this.mensaje.set(msg);
    this.error.set(esError);

    clearTimeout(this.timeoutRef);

    this.timeoutRef = setTimeout(() => {
      this.mensaje.set('');
    }, 2000);
  }

  cerrarAlerta(): void {
    this.mensaje.set('');
  }

  //  Valida antes de escribir: nunca mandamos datos a medias al backend
  private validarMedicamento(m: Medicine): string {
    if (!m.name || !m.name.trim()) {
      return 'El nombre del medicamento es obligatorio';
    }

    if (!m.laboratory || !m.laboratory.trim()) {
      return 'El laboratorio es obligatorio';
    }

    const numericos: [string, unknown][] = [
      ['stock', m.stock],
      ['precio de compra', m.purchasePrice],
      ['precio de venta', m.salePrice]
    ];

    for (const [campo, valor] of numericos) {
      //  Un input numérico vacío llega como null: no es un número válido
      if (typeof valor !== 'number' || !Number.isFinite(valor)) {
        return `El campo "${campo}" debe ser un número válido`;
      }

      if (valor < 0) {
        return `El campo "${campo}" no puede ser negativo`;
      }
    }

    if (m.salePrice < m.purchasePrice) {
      return 'El precio de venta no puede ser menor que el precio de compra';
    }

    return '';
  }

  //  Un 409 significa que el id derivado ya existe en la base de datos (L2)
  private mensajeDeErrorEscritura(err: unknown, contexto: string): string {
    const status = (err as { status?: number } | null | undefined)?.status;

    if (status === 409) {
      return 'Ese ID de medicamento ya existe en la base de datos. Recargue el inventario e intente de nuevo.';
    }

    return mensajeDeError(err, contexto);
  }
}

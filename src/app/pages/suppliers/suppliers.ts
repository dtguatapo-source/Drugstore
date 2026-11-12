import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Supplier, SupplierPayload } from '../../models/supplier';
import { SupplierService } from '../../services/supplier.service';
import { EstadoCarga } from '../../shared/estado-carga/estado-carga';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [FormsModule, EstadoCarga],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.css'
})
export class Suppliers {
  private readonly supplierService = inject(SupplierService);
  private readonly router = inject(Router);

  readonly proveedores = signal<Supplier[]>([]);
  readonly modalAbierto = signal<boolean>(false);
  readonly editandoId = signal<number | null>(null);
  readonly guardando = signal<boolean>(false);
  readonly borrando = signal<number | null>(null);
  readonly mensaje = signal<string>('');
  readonly error = signal<boolean>(false);

  // Estado de la carga del listado (S7): ' ' en errorCarga$ significa "sin error"
  readonly cargando = toSignal(this.supplierService.cargando$, { initialValue: false });
  readonly errorCarga = toSignal(this.supplierService.errorCarga$, { initialValue: '' });

  form: SupplierPayload = this.formularioVacio();

  // Diálogo de alta/edición: se usa para mover el foco y encerrar el Tab
  private readonly dialogo = viewChild<ElementRef<HTMLElement>>('dialogoProveedor');

  // Botón que abrió el diálogo: recupera el foco al cerrarlo
  private elementoOrigen: HTMLElement | null = null;

  private timeoutRef: any;
  private focoRef?: ReturnType<typeof setTimeout>;

  constructor() {
    this.supplierService.suppliers$.subscribe((data) => this.proveedores.set(data));
  }

  // Vuelve a pedir el listado a PostgreSQL
  reintentar(): void {
    this.supplierService.recargar();
  }

  abrirNuevo(evento?: Event): void {
    this.recordarOrigen(evento);
    this.editandoId.set(null);
    this.form = this.formularioVacio();
    this.abrirModal();
  }

  abrirEditar(proveedor: Supplier, evento?: Event): void {
    this.recordarOrigen(evento);
    this.editandoId.set(proveedor.id);
    this.form = {
      nit: proveedor.nit,
      name: proveedor.name,
      phone: proveedor.phone,
      email: proveedor.email,
      address: proveedor.address
    };
    this.abrirModal();
  }

  cerrarModal(): void {
    const estabaAbierto = this.modalAbierto();

    this.modalAbierto.set(false);
    this.guardando.set(false);

    // Se cancela el foco pendiente para que no se robe el foco ya devuelto
    clearTimeout(this.focoRef);

    if (estabaAbierto) {
      this.devolverFoco();
    }
  }

  /**
   * Tab encierra el foco dentro del diálogo y Escape lo cierra, como exige
   * cualquier diálogo modal para poder usarse solo con el teclado.
   */
  alPresionarTecla(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      this.cerrarModal();
      return;
    }

    if (evento.key !== 'Tab') {
      return;
    }

    const campos = this.camposEnfocables();

    if (campos.length === 0) {
      return;
    }

    const primero = campos[0];
    const ultimo = campos[campos.length - 1];
    const activo = evento.target as HTMLElement | null;

    // Los extremos se envuelven: del último campo se vuelve al primero
    if (evento.shiftKey && activo === primero) {
      evento.preventDefault();
      ultimo.focus();
      return;
    }

    if (!evento.shiftKey && activo === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }

  guardar(): void {
    const nombre = this.form.name.trim();
    const nit = this.form.nit.trim();
    const email = this.form.email.trim();

    if (!nombre || !nit) {
      this.mostrarAlerta('Complete el nombre y el NIT', true);
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.mostrarAlerta('El email no tiene un formato válido', true);
      return;
    }

    const payload: SupplierPayload = {
      nit,
      name: nombre,
      phone: this.form.phone.trim(),
      email,
      address: this.form.address.trim()
    };

    const id = this.editandoId();
    this.guardando.set(true);

    const peticion =
      id === null
        ? this.supplierService.createSupplier(payload)
        : this.supplierService.updateSupplier({ id, ...payload });

    peticion.subscribe({
      next: () => {
        this.cerrarModal();
        this.mostrarAlerta(id === null ? 'Proveedor creado' : 'Proveedor actualizado', false);
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarAlerta(
          this.mensajeDeError(err, 'No se pudo guardar el proveedor'),
          true
        );
      }
    });
  }

  eliminar(proveedor: Supplier): void {
    // Sin guarda, un doble clic dispara dos DELETE del mismo proveedor
    if (this.borrando() !== null) {
      return;
    }

    const confirmado = confirm(
      `¿Eliminar el proveedor "${proveedor.name}"? Esta acción no se puede deshacer.`
    );

    if (!confirmado) {
      return;
    }

    this.borrando.set(proveedor.id);

    this.supplierService.deleteSupplier(proveedor.id).subscribe({
      next: () => {
        this.borrando.set(null);
        this.mostrarAlerta('Proveedor eliminado', false);
      },
      error: (err) => {
        this.borrando.set(null);
        this.mostrarAlerta(
          this.mensajeDeError(
            err,
            'No se pudo eliminar el proveedor (verifique que no tenga compras asociadas)'
          ),
          true
        );
      }
    });
  }

  mostrarAlerta(msg: string, esError: boolean): void {
    this.mensaje.set(msg);
    this.error.set(esError);

    clearTimeout(this.timeoutRef);

    this.timeoutRef = setTimeout(() => {
      this.mensaje.set('');
    }, 2500);
  }

  cerrarAlerta(): void {
    this.mensaje.set('');
  }

  regresar(): void {
    this.router.navigate(['/dashboard']);
  }

  private formularioVacio(): SupplierPayload {
    return { nit: '', name: '', phone: '', email: '', address: '' };
  }

  private abrirModal(): void {
    this.modalAbierto.set(true);
    this.enfocarPrimerCampo();
  }

  // El botón que dispara la acción (si el evento no lo trae, el foco actual)
  private recordarOrigen(evento?: Event): void {
    const origen = evento?.currentTarget as HTMLElement | null;

    this.elementoOrigen =
      origen ?? (document.activeElement as HTMLElement | null) ?? null;
  }

  /**
   * El diálogo todavía no existe en el DOM cuando se abre: el foco se mueve
   * en el siguiente ciclo, cuando ya está dibujado.
   */
  private enfocarPrimerCampo(): void {
    clearTimeout(this.focoRef);

    this.focoRef = setTimeout(() => {
      const primero = this.camposEnfocables()[0];

      if (primero) {
        primero.focus();
      }
    });
  }

  private devolverFoco(): void {
    const origen = this.elementoOrigen;

    this.elementoOrigen = null;

    if (origen && origen.isConnected) {
      origen.focus();
    }
  }

  private camposEnfocables(): HTMLElement[] {
    const caja = this.dialogo()?.nativeElement;

    if (!caja) {
      return [];
    }

    const selector = 'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])';

    return Array.from(caja.querySelectorAll<HTMLElement>(selector)).filter(
      (elemento) => !elemento.hasAttribute('disabled')
    );
  }

  private mensajeDeError(err: any, respaldo: string): string {
    const msg = err?.error?.message;
    if (Array.isArray(msg)) {
      return msg[0];
    }
    return msg || respaldo;
  }
}

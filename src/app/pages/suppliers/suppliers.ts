import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Supplier, SupplierPayload } from '../../models/supplier';
import { SupplierService } from '../../services/supplier.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [FormsModule],
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
  readonly mensaje = signal<string>('');
  readonly error = signal<boolean>(false);

  form: SupplierPayload = this.formularioVacio();

  private timeoutRef: any;

  constructor() {
    this.supplierService.suppliers$.subscribe((data) => this.proveedores.set(data));
  }

  abrirNuevo(): void {
    this.editandoId.set(null);
    this.form = this.formularioVacio();
    this.modalAbierto.set(true);
  }

  abrirEditar(proveedor: Supplier): void {
    this.editandoId.set(proveedor.id);
    this.form = {
      nit: proveedor.nit,
      name: proveedor.name,
      phone: proveedor.phone,
      email: proveedor.email,
      address: proveedor.address
    };
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.guardando.set(false);
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
    const confirmado = confirm(
      `¿Eliminar el proveedor "${proveedor.name}"? Esta acción no se puede deshacer.`
    );

    if (!confirmado) {
      return;
    }

    this.supplierService.deleteSupplier(proveedor.id).subscribe({
      next: () => this.mostrarAlerta('Proveedor eliminado', false),
      error: (err) =>
        this.mostrarAlerta(
          this.mensajeDeError(
            err,
            'No se pudo eliminar el proveedor (verifique que no tenga compras asociadas)'
          ),
          true
        )
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

  private mensajeDeError(err: any, respaldo: string): string {
    const msg = err?.error?.message;
    if (Array.isArray(msg)) {
      return msg[0];
    }
    return msg || respaldo;
  }
}

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { Supplier, SupplierPayload } from '../../models/supplier';
import { SupplierService } from '../../services/supplier.service';
import { Suppliers } from './suppliers';

/** Doble del servicio: el listado lo controla el test y no hay backend. */
class SupplierServiceStub {
  readonly suppliers$ = new BehaviorSubject<Supplier[]>([]);
  readonly cargando$ = new BehaviorSubject<boolean>(false);
  readonly errorCarga$ = new BehaviorSubject<string>('');

  readonly borrados: number[] = [];

  recargar(): void {}

  createSupplier(proveedor: SupplierPayload): Observable<Supplier> {
    return of({ id: 99, ...proveedor });
  }

  updateSupplier(proveedor: Supplier): Observable<Supplier> {
    return of(proveedor);
  }

  deleteSupplier(id: number): Observable<void> {
    this.borrados.push(id);
    return of(undefined);
  }
}

describe('Suppliers (diálogo accesible)', () => {
  let fixture: ComponentFixture<Suppliers>;
  let componente: Suppliers;

  const raiz = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const dialogo = (): HTMLElement | null => raiz().querySelector('[role="dialog"]');

  /** El foco se mueve en un temporizador, cuando el diálogo ya está en el DOM. */
  const esperarFoco = async (): Promise<void> => {
    fixture.detectChanges();
    await new Promise((resolver) => setTimeout(resolver, 0));
    fixture.detectChanges();
  };

  const camposEnfocables = (contenedor: HTMLElement): HTMLElement[] =>
    Array.from(
      contenedor.querySelectorAll<HTMLElement>('input, select, textarea, button')
    ).filter((elemento) => !elemento.hasAttribute('disabled'));

  const presionar = (destino: HTMLElement, tecla: string, shift = false): void => {
    destino.dispatchEvent(
      new KeyboardEvent('keydown', { key: tecla, shiftKey: shift, bubbles: true })
    );
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Suppliers],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SupplierService, useValue: new SupplierServiceStub() }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Suppliers);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    componente.cerrarModal();
    (document.activeElement as HTMLElement | null)?.blur();
  });

  it('no debe renderizar el diálogo mientras está cerrado', () => {
    expect(dialogo()).toBeNull();
  });

  it('debe exponer role="dialog", aria-modal y aria-labelledby al abrirse', async () => {
    componente.abrirNuevo();
    await esperarFoco();

    const caja = dialogo();
    expect(caja).not.toBeNull();
    expect(caja!.getAttribute('aria-modal')).toBe('true');

    const idEtiqueta = caja!.getAttribute('aria-labelledby');
    expect(idEtiqueta).toBeTruthy();
    expect(caja!.querySelector(`#${idEtiqueta}`)?.textContent).toContain('Nuevo Proveedor');
  });

  it('debe mover el foco al primer campo del diálogo al abrirlo', async () => {
    componente.abrirNuevo();
    await esperarFoco();

    const caja = dialogo()!;
    expect(caja.contains(document.activeElement)).toBe(true);
    expect((document.activeElement as HTMLElement).id).toBe('sup-nit');
  });

  it('debe cerrar el diálogo con Escape', async () => {
    componente.abrirNuevo();
    await esperarFoco();
    expect(componente.modalAbierto()).toBe(true);

    presionar(dialogo()!, 'Escape');
    fixture.detectChanges();

    expect(componente.modalAbierto()).toBe(false);
    expect(dialogo()).toBeNull();
  });

  it('debe encerrar Tab dentro del diálogo (del último campo al primero)', async () => {
    componente.abrirNuevo();
    await esperarFoco();

    const caja = dialogo()!;
    const campos = camposEnfocables(caja);
    const primero = campos[0];
    const ultimo = campos[campos.length - 1];

    ultimo.focus();
    expect(document.activeElement).toBe(ultimo);

    presionar(ultimo, 'Tab');

    expect(document.activeElement).toBe(primero);
  });

  it('debe devolver el foco al botón que abrió el diálogo', async () => {
    const boton = raiz().querySelector('.encabezado button') as HTMLButtonElement;
    boton.focus();
    componente.abrirNuevo();
    await esperarFoco();

    componente.cerrarModal();
    fixture.detectChanges();

    expect(document.activeElement).toBe(boton);
  });

  it('debe vincular cada label del diálogo con su campo', async () => {
    componente.abrirNuevo();
    await esperarFoco();

    const caja = dialogo()!;
    const labels = Array.from(caja.querySelectorAll('label'));

    expect(labels.length).toBeGreaterThan(0);

    for (const label of labels) {
      const destino = label.getAttribute('for');
      expect(destino).toBeTruthy();
      expect(caja.querySelector(`#${destino}`)).not.toBeNull();
    }
  });
});

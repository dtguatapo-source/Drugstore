import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstadoCarga } from './estado-carga';

describe('EstadoCarga', () => {
  let fixture: ComponentFixture<EstadoCarga>;
  let componente: EstadoCarga;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EstadoCarga] }).compileComponents();
    fixture = TestBed.createComponent(EstadoCarga);
    componente = fixture.componentInstance;
  });

  it('no debe renderizar nada cuando no hay error ni carga en curso', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('');
    expect(fixture.nativeElement.querySelector('.status-banner')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });

  it('debe renderizar la línea de carga cuando solo hay una carga en curso', () => {
    fixture.componentRef.setInput('cargando', true);
    fixture.componentRef.setInput('error', '');
    fixture.detectChanges();

    const estado: HTMLElement = fixture.nativeElement.querySelector('[role="status"]');
    expect(estado).not.toBeNull();
    expect(estado.textContent).toContain('Cargando información');

    // Mientras carga no se ofrece reintentar
    expect(fixture.nativeElement.querySelector('.status-banner')).toBeNull();
  });

  it('debe mostrar el banner de error y emitir reintentar al pulsar el botón', () => {
    const reintentos: number[] = [];
    componente.reintentar.subscribe(() => reintentos.push(1));

    fixture.componentRef.setInput('error', 'No se pudo conectar con el servidor');
    // Aunque haya carga en curso, el error manda
    fixture.componentRef.setInput('cargando', true);
    fixture.detectChanges();

    const banner: HTMLElement = fixture.nativeElement.querySelector('.status-banner');
    expect(banner).not.toBeNull();
    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.textContent).toContain('No se pudo conectar con el servidor');

    const boton: HTMLButtonElement = banner.querySelector('button.btn')!;
    expect(boton).not.toBeNull();
    expect(boton.textContent).toContain('Reintentar');
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();

    boton.click();

    expect(reintentos.length).toBe(1);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Reports } from './reports';

describe('Reports', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Reports);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not shift the day when formatting an ISO date', () => {
    const fixture = TestBed.createComponent(Reports);
    expect(fixture.componentInstance.formatFecha('2026-11-09')).toBe('09/11/2026');
  });

  // El indicador de carga se reutiliza en las pruebas con el backend simulado.
  const RESPUESTA_VACIA = {
    sales: { total: 0, count: 0, items: 0 },
    purchases: { total: 0, count: 0, items: 0 },
    lowStock: 0,
  };

  function montarConBackendSimulado() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Reports],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Reports);
    fixture.detectChanges();

    // Los servicios raíz también piden sus listas al construirse.
    const pendientesDeServicios = () => {
      httpMock.expectOne('http://localhost:3000/medicines').flush([]);
      httpMock.expectOne('http://localhost:3000/sales').flush([]);
      fixture.detectChanges();
    };

    const indicador = (): HTMLElement | null =>
      fixture.nativeElement.querySelector('[data-testid="reports-cargando"]');

    return { httpMock, fixture, pendientesDeServicios, indicador };
  }

  it('should show an announced loading indicator until the reports finish loading', () => {
    const { httpMock, fixture, pendientesDeServicios, indicador } = montarConBackendSimulado();

    expect(indicador()).not.toBeNull();
    expect(indicador()?.getAttribute('role')).toBe('status');
    expect(indicador()?.getAttribute('aria-live')).toBe('polite');
    expect(indicador()?.textContent).toContain('Cargando estadísticas');

    // Las listas de los servicios no cierran la carga de estadísticas.
    pendientesDeServicios();
    expect(indicador()).not.toBeNull();

    httpMock.expectOne('http://localhost:3000/reports/summary').flush(RESPUESTA_VACIA);
    httpMock.expectOne('http://localhost:3000/reports/sales-by-date').flush([]);
    httpMock.expectOne('http://localhost:3000/reports/top-medicines').flush([]);
    fixture.detectChanges();

    expect(indicador()).toBeNull();
    httpMock.verify();
  });

  it('should keep the error banner with Reintentar when the reports fail', () => {
    const { httpMock, fixture, pendientesDeServicios, indicador } = montarConBackendSimulado();
    pendientesDeServicios();

    const fallar = (url: string) => httpMock.expectOne(url).error(new ErrorEvent('error'));

    fallar('http://localhost:3000/reports/summary');
    fallar('http://localhost:3000/reports/sales-by-date');
    fallar('http://localhost:3000/reports/top-medicines');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.status-banner') as HTMLElement | null;
    expect(banner).not.toBeNull();
    expect(banner?.getAttribute('role')).toBe('alert');
    expect(banner?.textContent).toContain('Reintentar');
    expect(indicador()).toBeNull();
    httpMock.verify();
  });
});

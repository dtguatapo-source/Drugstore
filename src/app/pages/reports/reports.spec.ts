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

  // ===== S10 / S11: vista general y filtro por medicamento / rango =====
  const MEDICINAS_BACKEND = [
    {
      id: 'M1',
      name: 'Ibuprofeno 400',
      laboratory: 'Bayer',
      stock: 50,
      purchasePrice: 100,
      salePrice: 200,
      category: 'Analgésico',
      description: 'Analgésico',
      keywords: '',
    },
    {
      id: 'M2',
      name: 'Amoxicilina 500',
      laboratory: 'Roemmers',
      stock: 20,
      purchasePrice: 150,
      salePrice: 300,
      category: 'Antibiótico',
      description: 'Antibiótico',
      keywords: '',
    },
  ];

  // Tres items de venta: M1 (2 uds), M2 (1 ud) y M1 (3 uds), en días consecutivos.
  const VENTAS_BACKEND = [
    {
      id: 1,
      date: '2026-11-09T10:00:00.000Z',
      items: [{ id: 11, medicineId: 'M1', quantity: 2, subtotal: 400 }],
    },
    {
      id: 2,
      date: '2026-11-10T10:00:00.000Z',
      items: [{ id: 12, medicineId: 'M2', quantity: 1, subtotal: 300 }],
    },
    {
      id: 3,
      date: '2026-11-11T10:00:00.000Z',
      items: [{ id: 13, medicineId: 'M1', quantity: 3, subtotal: 600 }],
    },
  ];

  function montarConFixtures() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Reports],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Reports);
    fixture.detectChanges();

    const flushServicios = () => {
      httpMock.expectOne('http://localhost:3000/medicines').flush(MEDICINAS_BACKEND);
      httpMock.expectOne('http://localhost:3000/sales').flush(VENTAS_BACKEND);
      fixture.detectChanges();
    };

    const flushReportes = () => {
      httpMock.expectOne('http://localhost:3000/reports/summary').flush(RESPUESTA_VACIA);
      httpMock
        .expectOne('http://localhost:3000/reports/sales-by-date')
        .flush([{ date: '2026-11-11', total: 600, count: 1 }]);
      httpMock.expectOne('http://localhost:3000/reports/top-medicines').flush([]);
      fixture.detectChanges();
    };

    const filas = (): HTMLElement[] =>
      Array.from(
        fixture.nativeElement.querySelectorAll('[data-testid="reports-registros"] tbody tr'),
      ) as HTMLElement[];

    const textoFilas = (): string[] => filas().map((f) => (f.textContent ?? '').replace(/\s+/g, ' ').trim());

    const escribirBusqueda = (texto: string) => {
      const input = fixture.nativeElement.querySelector('#med-search') as HTMLInputElement;
      input.value = texto;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    const escribirFecha = (id: string, valor: string) => {
      const input = fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
      input.value = valor;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    const boton = (etiqueta: string): HTMLButtonElement => {
      const encontrado = (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]).find(
        (b) => (b.textContent ?? '').trim().toUpperCase() === etiqueta,
      );
      if (!encontrado) throw new Error(`No se encontró el botón ${etiqueta}`);
      return encontrado;
    };

    return { httpMock, fixture, flushServicios, flushReportes, filas, textoFilas, escribirBusqueda, escribirFecha, boton };
  }

  it('should render the recent-records table on load, without any filter', () => {
    const { httpMock, fixture, flushServicios, flushReportes, filas, textoFilas } =
      montarConFixtures();

    flushServicios();
    flushReportes();

    expect(fixture.componentInstance.reporteGenerado()).toBe(false);
    expect(filas().length).toBe(3);

    // Más recientes primero: la última venta (3 uds de Ibuprofeno) encabeza la tabla.
    expect(textoFilas()[0]).toContain('3 uds');
    expect(textoFilas()[0]).toContain('Ibuprofeno 400');
    expect(textoFilas().join(' | ')).toContain('Amoxicilina 500');

    const encabezado = fixture.nativeElement.querySelector('[data-testid="reports-registros-card"]');
    expect((encabezado?.textContent ?? '')).toContain('Registros Recientes');
    httpMock.verify();
  });

  it('should leave only the selected medicine rows after filtering', () => {
    const { httpMock, fixture, flushServicios, flushReportes, filas, textoFilas, escribirBusqueda, boton } =
      montarConFixtures();

    flushServicios();
    flushReportes();

    escribirBusqueda('amoxi');
    const sugerencia = fixture.nativeElement.querySelector('.search-results .result-item') as HTMLButtonElement;
    expect(sugerencia).not.toBeNull();
    sugerencia.click();
    fixture.detectChanges();

    boton('VER REPORTE').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.reporteGenerado()).toBe(true);
    expect(filas().length).toBe(1);
    expect(textoFilas()[0]).toContain('Amoxicilina 500');
    expect(textoFilas().join(' | ')).not.toContain('Ibuprofeno 400');

    // La gráfica también se recalcula con el filtro (agregado en el navegador).
    const barras = fixture.nativeElement.querySelectorAll('.bar-row');
    expect(barras.length).toBe(1);
    httpMock.verify();
  });

  it('should restore the general rows and clear the filters on Limpiar', () => {
    const { httpMock, fixture, flushServicios, flushReportes, filas, textoFilas, escribirBusqueda, boton } =
      montarConFixtures();

    flushServicios();
    flushReportes();

    escribirBusqueda('amoxi');
    (fixture.nativeElement.querySelector('.search-results .result-item') as HTMLButtonElement).click();
    fixture.detectChanges();
    boton('VER REPORTE').click();
    fixture.detectChanges();
    expect(filas().length).toBe(1);

    boton('LIMPIAR').click();
    fixture.detectChanges();

    const componente = fixture.componentInstance;
    expect(componente.reporteGenerado()).toBe(false);
    expect(componente.searchText).toBe('');
    expect(componente.fechaDesde).toBe('');
    expect(componente.fechaHasta).toBe('');
    expect(filas().length).toBe(3);
    expect(textoFilas().join(' | ')).toContain('Amoxicilina 500');
    expect(textoFilas().join(' | ')).toContain('Ibuprofeno 400');
    httpMock.verify();
  });

  it('should show an explicit empty state when the filter matches nothing', () => {
    const { httpMock, fixture, flushServicios, flushReportes, escribirBusqueda, escribirFecha, boton } =
      montarConFixtures();

    flushServicios();
    flushReportes();

    escribirBusqueda('amoxi');
    (fixture.nativeElement.querySelector('.search-results .result-item') as HTMLButtonElement).click();
    fixture.detectChanges();

    // Rango sin ventas, independiente de la zona horaria de la máquina.
    escribirFecha('fecha-desde', '2030-01-01');
    escribirFecha('fecha-hasta', '2030-01-31');
    boton('VER REPORTE').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="reports-registros"]')).toBeNull();
    const vacio = fixture.nativeElement.querySelector(
      '[data-testid="reports-registros-vacio"]',
    ) as HTMLElement | null;
    expect(vacio).not.toBeNull();
    expect(vacio?.textContent).toContain('No hay ventas registradas para este filtro');
    httpMock.verify();
  });

  it('should disable VER REPORTE when the date range is invalid', () => {
    const { httpMock, fixture, flushServicios, flushReportes, escribirFecha, boton } =
      montarConFixtures();

    flushServicios();
    flushReportes();

    escribirFecha('fecha-desde', '2026-12-31');
    escribirFecha('fecha-hasta', '2026-01-01');

    const componente = fixture.componentInstance;
    expect(componente.rangoInvalido()).toBe(true);
    expect(boton('VER REPORTE').disabled).toBe(true);

    escribirFecha('fecha-hasta', '2027-01-01');
    expect(componente.rangoInvalido()).toBe(false);
    expect(boton('VER REPORTE').disabled).toBe(false);
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

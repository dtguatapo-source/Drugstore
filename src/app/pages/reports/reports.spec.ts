import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { Reports } from './reports';
import { PurchaseService } from '../../services/purchase.service';
import { Purchase } from '../../models/purchase';

/**
 * Doble de PurchaseService: el resto de la suite no debe depender del backend de
 * compras, así que se controlan los observables a mano.
 */
function crearComprasFake() {
  const compras = new BehaviorSubject<Purchase[]>([]);
  const cargando = new BehaviorSubject<boolean>(false);
  const error = new BehaviorSubject<string>('');

  return {
    purchases$: compras.asObservable(),
    cargando$: cargando.asObservable(),
    errorCarga$: error.asObservable(),
    loadPurchases: () => undefined,
    emitir: (lista: Purchase[]) => compras.next(lista),
    fallar: (mensaje: string) => error.next(mensaje),
  };
}

describe('Reports', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: PurchaseService, useValue: crearComprasFake() },
      ],
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
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PurchaseService, useValue: crearComprasFake() },
      ],
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
    const comprasFake = crearComprasFake();
    TestBed.configureTestingModule({
      imports: [Reports],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PurchaseService, useValue: comprasFake },
      ],
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

    const pestana = (etiqueta: string): HTMLButtonElement => {
      const encontrada = (
        Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]')) as HTMLButtonElement[]
      ).find((b) => (b.textContent ?? '').trim().toLowerCase() === etiqueta.toLowerCase());
      if (!encontrada) throw new Error(`No se encontró la pestaña ${etiqueta}`);
      return encontrada;
    };

    return {
      httpMock,
      fixture,
      flushServicios,
      flushReportes,
      filas,
      textoFilas,
      escribirBusqueda,
      escribirFecha,
      boton,
      pestana,
      compras: comprasFake,
    };
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

  // ===== S12: selector Informe de Ventas / Informe de Compras =====
  // Compras ya vienen planas del servicio: una fila por item de compra.
  const COMPRAS_BACKEND: Purchase[] = [
    {
      id: 'C1',
      date: '2026-11-09',
      provider: 'Droguería Sur',
      invoiceNumber: 'A-0001',
      medicineId: 'M1',
      quantity: 10,
      purchasePrice: 100,
      salePrice: 200,
      expiryDate: '2027-05-01',
      total: 1000,
    },
    {
      id: 'C2',
      date: '2026-11-10',
      provider: 'Droguería Sur',
      invoiceNumber: 'A-0002',
      medicineId: 'M2',
      quantity: 5,
      purchasePrice: 150,
      salePrice: 300,
      expiryDate: '2027-06-01',
      total: 750,
    },
    {
      id: 'C3',
      date: '2026-11-11',
      provider: 'Farmacéutica Norte',
      invoiceNumber: 'B-0001',
      medicineId: 'M1',
      quantity: 4,
      purchasePrice: 100,
      salePrice: 200,
      expiryDate: '2027-07-01',
      total: 400,
    },
  ];

  function montarConCompras() {
    const contexto = montarConFixtures();
    contexto.flushServicios();
    contexto.flushReportes();
    contexto.compras.emitir(COMPRAS_BACKEND);
    contexto.fixture.detectChanges();
    return contexto;
  }

  const filasCompras = (fixture: { nativeElement: HTMLElement }): HTMLElement[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="reports-compras"] tbody tr'),
    ) as HTMLElement[];

  it('should render the purchases table and hide the sales table in Informe de Compras', () => {
    const { httpMock, fixture, pestana } = montarConCompras();

    // Por defecto se ve el informe de ventas, con su tabla.
    expect(fixture.nativeElement.querySelector('[role="tablist"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="reports-registros"]')).not.toBeNull();

    const tabCompras = pestana('Informe de Compras');
    expect(tabCompras.getAttribute('aria-selected')).toBe('false');
    expect(tabCompras.getAttribute('aria-controls')).toBe('panel-compras');

    tabCompras.click();
    fixture.detectChanges();

    expect(tabCompras.getAttribute('aria-selected')).toBe('true');
    expect(pestana('Informe de Ventas').getAttribute('aria-selected')).toBe('false');

    const panel = fixture.nativeElement.querySelector('[role="tabpanel"]') as HTMLElement;
    expect(panel.getAttribute('id')).toBe('panel-compras');
    expect(panel.getAttribute('aria-labelledby')).toBe('tab-compras');

    expect(fixture.nativeElement.querySelector('[data-testid="reports-registros"]')).toBeNull();
    const filas = filasCompras(fixture);
    expect(filas.length).toBe(3);
    const texto = filas.map((f) => (f.textContent ?? '').replace(/\s+/g, ' ').trim()).join(' | ');
    expect(texto).toContain('Droguería Sur');
    expect(texto).toContain('Ibuprofeno 400');
    expect(texto).toContain('Amoxicilina 500');
    httpMock.verify();
  });

  it('should compute the purchases KPIs from the fixtures', () => {
    const { httpMock, fixture, pestana } = montarConCompras();
    pestana('Informe de Compras').click();
    fixture.detectChanges();

    const componente = fixture.componentInstance;
    expect(componente.totalInvertido()).toBe(2150);
    expect(componente.lineasCompra()).toBe(3);
    expect(componente.proveedoresDistintos()).toBe(2);
    expect(componente.medicamentoMasComprado()?.nombre).toBe('Ibuprofeno 400');
    expect(componente.medicamentoMasComprado()?.cantidad).toBe(14);

    const total = fixture.nativeElement.querySelector('[data-testid="compras-total"]');
    const lineas = fixture.nativeElement.querySelector('[data-testid="compras-lineas"]');
    expect((total?.textContent ?? '').replace(/[^0-9]/g, '')).toBe('2150');
    expect((lineas?.textContent ?? '').replace(/[^0-9]/g, '')).toBe('3');

    // L5 queda visible junto a los KPIs de compras.
    const nota = fixture.nativeElement.querySelector('[data-testid="compras-nota"]') as HTMLElement;
    expect(nota).not.toBeNull();
    expect(nota.textContent).toContain('líneas de compra');
    httpMock.verify();
  });

  it('should export the rows of the active mode with the active filter applied', () => {
    const { httpMock, fixture, pestana, escribirBusqueda, boton } = montarConCompras();
    const componente = fixture.componentInstance;

    // Ventas sin filtro: filas generales de la tabla visible.
    expect(componente.filasExportables().length).toBe(3);
    expect(Object.keys(componente.filasExportables()[0])).toContain('Fecha de Venta');

    escribirBusqueda('amoxi');
    (
      fixture.nativeElement.querySelector('.search-results .result-item') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    boton('VER REPORTE').click();
    fixture.detectChanges();

    const exportadasVentas = componente.filasExportables();
    expect(exportadasVentas.length).toBe(1);
    expect(JSON.stringify(exportadasVentas)).toContain('Amoxicilina 500');

    // Cambiar de modo no arrastra el filtro de ventas.
    pestana('Informe de Compras').click();
    fixture.detectChanges();

    expect(componente.reporteGenerado()).toBe(false);
    const exportadasCompras = componente.filasExportables();
    expect(exportadasCompras.length).toBe(3);
    expect(Object.keys(exportadasCompras[0])).toContain('Proveedor');
    expect(componente.nombreHoja()).toBe('Informe de Compras');

    // El filtro se aplica también al modo compras.
    escribirBusqueda('ibupro');
    const sugerencia = (
      Array.from(
        fixture.nativeElement.querySelectorAll('.search-results .result-item'),
      ) as HTMLButtonElement[]
    ).find((b) => (b.textContent ?? '').includes('Ibuprofeno')) as HTMLButtonElement;
    sugerencia.click();
    fixture.detectChanges();
    boton('VER REPORTE').click();
    fixture.detectChanges();

    const filtradas = componente.filasExportables();
    expect(filtradas.length).toBe(2);
    expect(JSON.stringify(filtradas)).toContain('Ibuprofeno 400');
    expect(JSON.stringify(filtradas)).not.toContain('Amoxicilina 500');
    expect(componente.lineasCompra()).toBe(2);
    httpMock.verify();
  });

  it('should restore the sales table when switching back to Informe de Ventas', () => {
    const { httpMock, fixture, pestana } = montarConCompras();

    pestana('Informe de Compras').click();
    fixture.detectChanges();
    expect(filasCompras(fixture).length).toBe(3);

    pestana('Informe de Ventas').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="reports-compras"]')).toBeNull();
    const filas = fixture.nativeElement.querySelectorAll(
      '[data-testid="reports-registros"] tbody tr',
    );
    expect(filas.length).toBe(3);
    expect(fixture.componentInstance.modo()).toBe('ventas');
    httpMock.verify();
  });
});

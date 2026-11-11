import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Medicine } from '../models/medicine';
import { MedicineService } from './medicine.service';

const URL_MEDICAMENTOS = 'http://localhost:3000/medicines';

/**
 * Crea una respuesta de error de red: el backend no responde y el
 * navegador entrega status 0 (es lo que ocurre cuando no hay servidor).
 */
function errorDeRed() {
  return new ProgressEvent('error');
}

describe('MedicineService (estados de carga y error)', () => {
  let httpMock: HttpTestingController;
  let servicio: MedicineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    httpMock = TestBed.inject(HttpTestingController);
    servicio = TestBed.inject(MedicineService);
  });

  afterEach(() => {
    // La carga inicial del constructor debe quedar siempre resuelta
    httpMock.verify();
  });

  it('debe encender cargando$ al iniciar la carga y apagarlo al recibir la respuesta', () => {
    const estados: boolean[] = [];
    servicio.cargando$.subscribe((valor) => estados.push(valor));

    // La carga inicial la dispara el constructor del servicio
    expect(estados[0]).toBe(true);

    httpMock.expectOne(URL_MEDICAMENTOS).flush([]);

    expect(estados[estados.length - 1]).toBe(false);
  });

  it('debe emitir un mensaje en español y dejar medicines$ en [] cuando el backend no responde', () => {
    const errores: string[] = [];
    const listas: Medicine[][] = [];
    const estados: boolean[] = [];
    servicio.errorCarga$.subscribe((valor) => errores.push(valor));
    servicio.medicines$.subscribe((valor) => listas.push(valor));
    servicio.cargando$.subscribe((valor) => estados.push(valor));

    expect(errores[0]).toBe(''); // Arranca sin error

    httpMock.expectOne(URL_MEDICAMENTOS).error(errorDeRed(), {
      status: 0,
      statusText: 'Unknown Error'
    });

    const mensaje = errores[errores.length - 1];
    expect(mensaje.length).toBeGreaterThan(0);
    expect(mensaje).toContain('servidor');

    // Sin datos reales: la tabla sigue vacía, nunca con datos inventados
    expect(listas[listas.length - 1]).toEqual([]);

    // El indicador de carga se apaga también en el camino de error
    expect(estados[estados.length - 1]).toBe(false);
  });

  it('debe limpiar errorCarga$ al iniciar una recarga y al recibir datos correctos', () => {
    const errores: string[] = [];
    servicio.errorCarga$.subscribe((valor) => errores.push(valor));

    httpMock.expectOne(URL_MEDICAMENTOS).error(errorDeRed(), {
      status: 0,
      statusText: 'Unknown Error'
    });
    expect(errores[errores.length - 1]).not.toBe('');

    // Reintento: el error se limpia en cuanto empieza la nueva carga
    servicio.loadMedicines();
    expect(errores[errores.length - 1]).toBe('');

    httpMock
      .expectOne(URL_MEDICAMENTOS)
      .flush([
        {
          id: 'MED-1',
          name: 'Ibuprofeno',
          laboratory: 'Genfar',
          category: 'Analgésico',
          description: 'Tabletas',
          keywords: 'dolor, fiebre',
          stock: 5,
          purchasePrice: '1.50',
          salePrice: '2.50'
        }
      ]);

    expect(errores[errores.length - 1]).toBe('');
  });

  it('debe mostrar el mensaje del backend cuando responde con un error de validación', () => {
    const errores: string[] = [];
    servicio.errorCarga$.subscribe((valor) => errores.push(valor));

    httpMock.expectOne(URL_MEDICAMENTOS).flush(
      { message: ['El nombre es obligatorio', 'El laboratorio es obligatorio'] },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(errores[errores.length - 1]).toBe(
      'El nombre es obligatorio, El laboratorio es obligatorio'
    );
  });

  it('debe conservar la adaptación de los datos que llegan del backend', () => {
    const listas: Medicine[][] = [];
    servicio.medicines$.subscribe((valor) => listas.push(valor));

    httpMock.expectOne(URL_MEDICAMENTOS).flush([
      {
        id: 'MED-1',
        name: 'Ibuprofeno',
        laboratory: 'Genfar',
        category: 'Analgésico',
        description: 'Tabletas',
        keywords: 'dolor, fiebre',
        stock: 0,
        purchasePrice: '1.50',
        salePrice: '2.50'
      }
    ]);

    const lista = listas[listas.length - 1];
    expect(lista.length).toBe(1);
    expect(lista[0].keywords).toEqual(['dolor', 'fiebre']);
    expect(lista[0].purchasePrice).toBe(1.5);
    expect(lista[0].status).toBe('Sin stock');
  });
});

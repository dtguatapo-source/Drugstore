import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';

/** Ruta de relleno para que la navegación al login del 401 sea real y no un error. */
@Component({ standalone: true, template: '' })
class RutaVacia {}

// Se usa una URL absoluta real del backend para comprobar que el interceptor no
// altera la petición salvo en la cabecera Authorization.
const URL_MEDICAMENTOS = 'http://localhost:3000/medicines';

function preparar() {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      provideRouter([{ path: 'login', component: RutaVacia }])
    ]
  });

  return {
    http: TestBed.inject(HttpClient),
    httpMock: TestBed.inject(HttpTestingController),
    router: TestBed.inject(Router)
  };
}

/** La navegación del router se resuelve en microtareas: se le da un turno completo. */
async function asentarNavegacion(): Promise<void> {
  await new Promise((resolver) => setTimeout(resolver, 0));
}

/** Deja una sesión completa, como después de un login exitoso. */
function guardarSesion(token: string = 'jwt-de-prueba'): void {
  localStorage.setItem('login', 'admin');
  localStorage.setItem('token', token);
  localStorage.setItem('user', '{"login":"admin"}');
}

describe('authInterceptor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should attach the stored JWT as a Bearer header', () => {
    guardarSesion();
    const { http, httpMock } = preparar();

    http.get(URL_MEDICAMENTOS).subscribe();

    const peticion = httpMock.expectOne(URL_MEDICAMENTOS);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer jwt-de-prueba');

    peticion.flush([]);
    httpMock.verify();
  });

  it('should not add any header when there is no stored token', () => {
    const { http, httpMock } = preparar();

    http.get(URL_MEDICAMENTOS).subscribe();

    const peticion = httpMock.expectOne(URL_MEDICAMENTOS);
    expect(peticion.request.headers.has('Authorization')).toBe(false);

    peticion.flush([]);
    httpMock.verify();
  });

  it('should not send a token that is empty or the literal "undefined"', () => {
    const { http, httpMock } = preparar();

    localStorage.setItem('token', '   ');
    http.get(`${URL_MEDICAMENTOS}?caso=vacio`).subscribe();
    const vacio = httpMock.expectOne(`${URL_MEDICAMENTOS}?caso=vacio`);
    expect(vacio.request.headers.has('Authorization')).toBe(false);
    vacio.flush([]);

    localStorage.setItem('token', 'undefined');
    http.get(`${URL_MEDICAMENTOS}?caso=indefinido`).subscribe();
    const indefinido = httpMock.expectOne(`${URL_MEDICAMENTOS}?caso=indefinido`);
    expect(indefinido.request.headers.has('Authorization')).toBe(false);
    indefinido.flush([]);

    httpMock.verify();
  });

  it('should not overwrite an Authorization header that is already present', () => {
    guardarSesion();
    const { http, httpMock } = preparar();

    http.get(URL_MEDICAMENTOS, { headers: { Authorization: 'Bearer propio' } }).subscribe();

    const peticion = httpMock.expectOne(URL_MEDICAMENTOS);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer propio');

    peticion.flush([]);
    httpMock.verify();
  });

  it('should clear the session and go to /login on a 401, and still deliver the error', async () => {
    guardarSesion();
    const { http, httpMock, router } = preparar();

    let estado: number | undefined;
    http.get(URL_MEDICAMENTOS).subscribe({
      error: (err) => {
        estado = err.status;
      }
    });

    httpMock
      .expectOne(URL_MEDICAMENTOS)
      .flush({ message: 'No autorizado' }, { status: 401, statusText: 'No autorizado' });

    await asentarNavegacion();

    expect(router.url).toBe('/login');
    expect(localStorage.getItem('login')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    // El error sigue llegando a quien se suscribió: la pantalla muestra su mensaje.
    expect(estado).toBe(401);
    httpMock.verify();
  });

  it('should keep the session intact when the error is not a 401', async () => {
    guardarSesion();
    const { http, httpMock, router } = preparar();

    let estado: number | undefined;
    http.get(URL_MEDICAMENTOS).subscribe({
      error: (err) => {
        estado = err.status;
      }
    });

    httpMock
      .expectOne(URL_MEDICAMENTOS)
      .flush(null, { status: 500, statusText: 'Error del servidor' });

    await asentarNavegacion();

    expect(estado).toBe(500);
    expect(router.url).not.toBe('/login');
    expect(localStorage.getItem('login')).toBe('admin');
    expect(localStorage.getItem('token')).toBe('jwt-de-prueba');
    expect(localStorage.getItem('user')).toBe('{"login":"admin"}');
    httpMock.verify();
  });
});

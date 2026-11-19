import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { limpiarSesion } from '../pages/auth.guard/auth.guard';

/**
 * Lee el JWT guardado en la sesión, sólo en el navegador.
 *
 * En el prerender SSR no existe `localStorage`, así que la lectura siempre va
 * detrás de `isPlatformBrowser`. Un token vacío o guardado como "undefined"
 * no se envía: es peor mandar basura que no mandar nada.
 */
export function tokenDeSesion(esNavegador: boolean): string | null {
  if (!esNavegador) {
    return null;
  }

  const token = localStorage.getItem('token');
  if (token === null) {
    return null;
  }

  const limpio = token.trim();
  if (limpio === '' || limpio.toLowerCase() === 'undefined' || limpio.toLowerCase() === 'null') {
    return null;
  }

  return limpio;
}

/**
 * Adjunta el token JWT a todas las peticiones al backend y cierra la sesión
 * cuando el backend responde 401.
 *
 * Nunca pisa una cabecera `Authorization` que ya venga puesta, y cualquier otro
 * código de error pasa intacto: la pantalla decide qué mensaje mostrar.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const esNavegador = isPlatformBrowser(platformId);

  const token = tokenDeSesion(esNavegador);
  const peticion =
    token && !req.headers.has('Authorization')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      // El token venció o fue revocado: se borra la sesión y se vuelve al login.
      // El error se reenvía igual para que quien llamó muestre su propio mensaje.
      if (error.status === 401 && esNavegador) {
        limpiarSesion();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};

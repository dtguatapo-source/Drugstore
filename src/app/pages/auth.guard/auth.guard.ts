import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';

/** Claves que se guardan en localStorage al iniciar sesión. */
export const CLAVES_SESION = ['login', 'token', 'user'] as const;

/** Borra por completo la sesión del navegador. */
export function limpiarSesion(): void {
  for (const clave of CLAVES_SESION) {
    localStorage.removeItem(clave);
  }
}

/**
 * Comprueba que el JWT tenga forma válida y que su claim `exp`
 * (segundos desde epoch) todavía no haya vencido.
 *
 * El frontend no puede verificar la firma: la autorización real la hace el
 * backend en cada petición. Aquí solo se evita navegar con una sesión muerta.
 */
export function esTokenVigente(token: string | null, ahoraMs: number = Date.now()): boolean {
  if (!token) {
    return false;
  }

  const partes = token.split('.');
  if (partes.length !== 3) {
    return false;
  }

  const payload = decodificarPayload(partes[1]);
  if (!payload) {
    return false;
  }

  const exp = payload['exp'];
  if (typeof exp !== 'number' || !Number.isFinite(exp)) {
    return false;
  }

  return exp * 1000 > ahoraMs;
}

function decodificarPayload(segmento: string): Record<string, unknown> | null {
  try {
    // Los JWT usan base64url: se normaliza y se rellena antes de decodificar.
    const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/');
    const relleno = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(relleno)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Rol firmado en el JWT de la sesión actual. Devuelve null si no hay sesión o si
 * el token no trae un rol utilizable: nunca se asume un rol por defecto.
 */
export function rolDeSesion(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('token');
  if (!esTokenVigente(token)) {
    return null;
  }

  const payload = decodificarPayload((token as string).split('.')[1]);
  const rol = payload?.['role'];

  return typeof rol === 'string' && rol.trim() !== '' ? rol.trim() : null;
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // En el prerender SSR no existe localStorage: se deja pasar y la validación
  // real ocurre en el navegador.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const login = localStorage.getItem('login');
  const token = localStorage.getItem('token');

  if (login && esTokenVigente(token)) {
    return true;
  }

  // Sesión vencida, incompleta o manipulada: no se deja rastro en el navegador.
  limpiarSesion();
  router.navigate(['/login']);
  return false;
};

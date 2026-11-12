import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { rolDeSesion } from './auth.guard';

/**
 * Exige un rol concreto además de una sesión válida. El backend ya rechaza la
 * operación con 403; esto solo evita que el usuario llegue a una pantalla que
 * no puede usar.
 */
export function roleGuard(rolRequerido: string): CanActivateFn {
  return () => {
    const platformId = inject(PLATFORM_ID);

    // Durante el prerender SSR no hay sesión que evaluar
    if (!isPlatformBrowser(platformId)) {
      return true;
    }

    if (rolDeSesion() === rolRequerido) {
      return true;
    }

    inject(Router).navigate(['/dashboard']);
    return false;
  };
}

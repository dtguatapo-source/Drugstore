import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const login = localStorage.getItem('login');

  // Si existe la sesión, lo dejamos pasar libremente
  if (login) {
    return true;
  }

  // Si NO existe, lo mandamos al login y bloqueamos la pantalla
  router.navigate(['/login']);
  return false;
};
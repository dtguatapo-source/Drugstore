import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Rutas privadas: sus datos salen de la base y requieren sesión.
 * Se renderizan en el navegador para que ningún registro quede horneado en el HTML
 * estático y para que el build de producción no dependa de una API viva.
 */
const RUTAS_PRIVADAS = ['dashboard', 'inventory', 'sales', 'purchases', 'suppliers', 'reports'];

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  ...RUTAS_PRIVADAS.map((path): ServerRoute => ({ path, renderMode: RenderMode.Client })),
  { path: '**', renderMode: RenderMode.Client },
];

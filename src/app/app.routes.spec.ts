import { authGuard } from './pages/auth.guard/auth.guard';
import { routes } from './app.routes';

/** Rutas privadas: cada módulo de la droguería. */
const RUTAS_PRIVADAS = ['dashboard', 'inventory', 'purchases', 'suppliers', 'sales', 'reports'];

function rutaDe(path: string) {
  const encontrada = routes.find((ruta) => ruta.path === path);
  if (!encontrada) {
    throw new Error(`No existe la ruta ${path} en app.routes.ts`);
  }
  return encontrada;
}

describe('app.routes', () => {
  it('should expose the six modules of the drugstore', () => {
    expect(RUTAS_PRIVADAS.every((path) => routes.some((ruta) => ruta.path === path))).toBe(true);
  });

  it('should guard every private route with authGuard and nothing else', () => {
    // Una sola administradora: no hay guard de roles que oculte módulos
    for (const path of RUTAS_PRIVADAS) {
      expect(rutaDe(path).canActivate).toEqual([authGuard]);
    }
  });

  it('should keep login public and expose no register route', () => {
    // La droguería la maneja una sola administradora: no hay pantalla pública de registro
    expect(rutaDe('login').canActivate).toBeUndefined();
    expect(routes.some((ruta) => ruta.path === 'register')).toBe(false);
  });
});

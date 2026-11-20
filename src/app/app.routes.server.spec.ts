import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

/** Rutas privadas: su contenido sale de la base de datos, nunca puede quedar estático. */
const RUTAS_CON_DATOS = ['dashboard', 'inventory', 'sales', 'purchases', 'suppliers', 'reports'];

describe('serverRoutes', () => {
  it('no prerenderiza las rutas privadas que cargan datos de la base', () => {
    for (const path of RUTAS_CON_DATOS) {
      const ruta = serverRoutes.find((serverRoute) => serverRoute.path === path);

      expect(ruta, `falta la entrada de "${path}" en serverRoutes`).toBeDefined();
      expect(ruta?.renderMode, `"${path}" no debería prerenderizarse`).not.toBe(
        RenderMode.Prerender,
      );
    }
  });

  it('mantiene prerenderizado el login, que no depende de la base', () => {
    const ruta = serverRoutes.find((serverRoute) => serverRoute.path === 'login');

    expect(ruta?.renderMode, '"login" debería seguir prerenderizándose').toBe(RenderMode.Prerender);
  });

  it('no deja ninguna entrada para la página de registro eliminada', () => {
    expect(serverRoutes.some((serverRoute) => serverRoute.path === 'register')).toBe(false);
  });

  it('el comodín final no prerenderiza, porque cubre cualquier ruta desconocida', () => {
    const comodin = serverRoutes.find((serverRoute) => serverRoute.path === '**');

    expect(comodin, 'falta la entrada comodín').toBeDefined();
    expect(comodin?.renderMode).not.toBe(RenderMode.Prerender);
  });
});

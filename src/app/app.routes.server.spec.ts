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

  it('mantiene prerenderizadas las páginas públicas, que no dependen de la base', () => {
    for (const path of ['login', 'register']) {
      const ruta = serverRoutes.find((serverRoute) => serverRoute.path === path);

      expect(ruta?.renderMode, `"${path}" debería seguir prerenderizándose`).toBe(
        RenderMode.Prerender,
      );
    }
  });

  it('el comodín final no prerenderiza, porque cubre cualquier ruta desconocida', () => {
    const comodin = serverRoutes.find((serverRoute) => serverRoute.path === '**');

    expect(comodin, 'falta la entrada comodín').toBeDefined();
    expect(comodin?.renderMode).not.toBe(RenderMode.Prerender);
  });
});

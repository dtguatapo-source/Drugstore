import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { rolDeSesion } from './auth.guard';
import { roleGuard } from './role.guard';

const RUTA = {} as ActivatedRouteSnapshot;
const ESTADO = {} as RouterStateSnapshot;

function tokenConRol(rol: unknown, segundosDeVida = 600): string {
  const payload = btoa(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + segundosDeVida, role: rol })
  );
  return `cabecera.${payload}.firma`;
}

function armarGuard() {
  const navegado: unknown[][] = [];
  TestBed.configureTestingModule({
    providers: [{ provide: Router, useValue: { navigate: (i: unknown[]) => navegado.push(i) } }]
  });
  return { navegado };
}

describe('rolDeSesion', () => {
  afterEach(() => localStorage.clear());

  it('should return null without a token', () => {
    expect(rolDeSesion()).toBeNull();
  });

  it('should read the role signed in the token', () => {
    localStorage.setItem('login', 'admin');
    localStorage.setItem('token', tokenConRol('ADMIN'));

    expect(rolDeSesion()).toBe('ADMIN');
  });

  it('should return null when the token expired', () => {
    localStorage.setItem('login', 'admin');
    localStorage.setItem('token', tokenConRol('ADMIN', -60));

    expect(rolDeSesion()).toBeNull();
  });

  it('should return null when the payload carries no usable role', () => {
    localStorage.setItem('login', 'admin');
    localStorage.setItem('token', tokenConRol(undefined));

    expect(rolDeSesion()).toBeNull();
  });
});

describe('roleGuard', () => {
  afterEach(() => localStorage.clear());

  it('should allow the required role', () => {
    localStorage.setItem('login', 'admin');
    localStorage.setItem('token', tokenConRol('ADMIN'));
    const { navegado } = armarGuard();

    const resultado = TestBed.runInInjectionContext(() => roleGuard('ADMIN')(RUTA, ESTADO));

    expect(resultado).toBe(true);
    expect(navegado).toEqual([]);
  });

  it('should send a different role back to the dashboard', () => {
    localStorage.setItem('login', 'cajero');
    localStorage.setItem('token', tokenConRol('USER'));
    const { navegado } = armarGuard();

    const resultado = TestBed.runInInjectionContext(() => roleGuard('ADMIN')(RUTA, ESTADO));

    expect(resultado).toBe(false);
    expect(navegado).toEqual([['/dashboard']]);
  });

  it('should not assume a role when there is no session', () => {
    const { navegado } = armarGuard();

    const resultado = TestBed.runInInjectionContext(() => roleGuard('ADMIN')(RUTA, ESTADO));

    expect(resultado).toBe(false);
    expect(navegado).toEqual([['/dashboard']]);
  });
});

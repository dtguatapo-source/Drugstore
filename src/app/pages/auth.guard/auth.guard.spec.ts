import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { authGuard, esTokenVigente } from './auth.guard';

const RUTA = {} as ActivatedRouteSnapshot;
const ESTADO = {} as RouterStateSnapshot;

/**
 * Construye un JWT sintáctico con el payload indicado. No se firma porque el
 * frontend no puede verificar la firma: sólo lee el claim `exp`.
 */
function tokenConPayload(payload: unknown): string {
  const cuerpo = btoa(JSON.stringify(payload));
  return `cabecera.${cuerpo}.firma`;
}

function armarGuard() {
  const navegado: unknown[][] = [];
  const falsoRouter = {
    navigate: (instrucciones: unknown[]) => {
      navegado.push(instrucciones);
      return Promise.resolve(true);
    }
  };

  TestBed.configureTestingModule({
    providers: [{ provide: Router, useValue: falsoRouter }]
  });

  return { navegado };
}

describe('esTokenVigente', () => {
  const AHORA = 1_700_000_000_000; // segundos: 1_700_000_000

  it('should reject a missing token', () => {
    expect(esTokenVigente(null, AHORA)).toBe(false);
    expect(esTokenVigente('', AHORA)).toBe(false);
  });

  it('should reject a token without the three JWT segments', () => {
    expect(esTokenVigente('no-es-un-jwt', AHORA)).toBe(false);
    expect(esTokenVigente('cabecera.payload', AHORA)).toBe(false);
  });

  it('should reject a token whose payload is not decodable JSON', () => {
    expect(esTokenVigente('cabecera.###.firma', AHORA)).toBe(false);
  });

  it('should reject a payload without the exp claim', () => {
    expect(esTokenVigente(tokenConPayload({ sub: 'admin' }), AHORA)).toBe(false);
    expect(esTokenVigente(tokenConPayload({ exp: 'no-numerico' }), AHORA)).toBe(false);
  });

  it('should reject a token that expired one second ago', () => {
    const expirado = tokenConPayload({ exp: Math.floor(AHORA / 1000) - 1 });
    expect(esTokenVigente(expirado, AHORA)).toBe(false);
  });

  it('should accept a token that expires in the future', () => {
    const vigente = tokenConPayload({ exp: Math.floor(AHORA / 1000) + 60 });
    expect(esTokenVigente(vigente, AHORA)).toBe(true);
  });
});

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should allow navigation with a valid session', () => {
    localStorage.setItem('login', 'admin');
    localStorage.setItem('token', tokenConPayload({ exp: Math.floor(Date.now() / 1000) + 600 }));
    localStorage.setItem('user', '{"login":"admin"}');
    const { navegado } = armarGuard();

    const resultado = TestBed.runInInjectionContext(() => authGuard(RUTA, ESTADO));

    expect(resultado).toBe(true);
    expect(navegado).toEqual([]);
    expect(localStorage.getItem('token')).not.toBeNull();
  });

  it('should redirect to /login when there is no session', () => {
    const { navegado } = armarGuard();

    const resultado = TestBed.runInInjectionContext(() => authGuard(RUTA, ESTADO));

    expect(resultado).toBe(false);
    expect(navegado).toEqual([['/login']]);
  });

  it('should clear every session key and redirect when the token is expired', () => {
    localStorage.setItem('login', 'admin');
    localStorage.setItem('token', tokenConPayload({ exp: Math.floor(Date.now() / 1000) - 60 }));
    localStorage.setItem('user', '{"login":"admin"}');
    const { navegado } = armarGuard();

    const resultado = TestBed.runInInjectionContext(() => authGuard(RUTA, ESTADO));

    expect(resultado).toBe(false);
    expect(navegado).toEqual([['/login']]);
    expect(localStorage.getItem('login')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should reject a session that has login but no token', () => {
    localStorage.setItem('login', 'admin');
    const { navegado } = armarGuard();

    const resultado = TestBed.runInInjectionContext(() => authGuard(RUTA, ESTADO));

    expect(resultado).toBe(false);
    expect(navegado).toEqual([['/login']]);
    expect(localStorage.getItem('login')).toBeNull();
  });

  it('should reject a token that is not a JWT', () => {
    localStorage.setItem('login', 'admin');
    localStorage.setItem('token', 'token-invalido');
    const { navegado } = armarGuard();

    const resultado = TestBed.runInInjectionContext(() => authGuard(RUTA, ESTADO));

    expect(resultado).toBe(false);
    expect(navegado).toEqual([['/login']]);
    expect(localStorage.getItem('token')).toBeNull();
  });
});

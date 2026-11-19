import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';

/** Ruta vacía para que la navegación al login del logout sea real y no un error. */
@Component({ standalone: true, template: '' })
class RutaVacia {}

/** JWT armado a mano: la app solo lee `exp` y `role`, nunca verifica la firma. */
function tokenConRol(rol: string, segundosDeVida = 600): string {
  const payload = btoa(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + segundosDeVida, role: rol })
  );
  return `cabecera.${payload}.firma`;
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([{ path: 'login', component: RutaVacia }])]
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the system name in the navbar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.nombre-sistema')?.textContent).toContain(
      'SISTEMA DROGUERÍA PILI'
    );
  });

  it('should show the six modules and the Administradora badge to any session', () => {
    // La droguería tiene una sola administradora: no hay módulos ocultos por rol
    localStorage.setItem('login', 'pili');
    localStorage.setItem('token', tokenConRol('USER'));
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const enlaces = Array.from(compiled.querySelectorAll('.nav-link')).map((enlace) =>
      enlace.getAttribute('href')
    );

    expect(enlaces).toEqual([
      '/dashboard',
      '/inventory',
      '/purchases',
      '/suppliers',
      '/sales',
      '/reports'
    ]);
    expect(compiled.querySelector('.admin-badge')?.textContent?.trim()).toBe('Administradora');
  });

  it('should clear every session key and go to /login on logout', async () => {
    localStorage.setItem('login', 'admin');
    localStorage.setItem('token', 'token');
    localStorage.setItem('user', '{"login":"admin"}');
    const fixture = TestBed.createComponent(App);

    fixture.componentInstance.salir();
    await fixture.whenStable();

    expect(localStorage.getItem('login')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/login');
  });
});

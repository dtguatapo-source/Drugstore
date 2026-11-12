import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Login } from './login';

/** Ruta vacía: el login navega al dashboard y queremos una navegación real. */
@Component({ standalone: true, template: '' })
class RutaVacia {}

describe('Login', () => {
  let component: Login;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([{ path: 'dashboard', component: RutaVacia }]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    component = TestBed.createComponent(Login).componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not store a session when the response carries no token', () => {
    component.entrarAlSistema({});

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('login')).toBeNull();
    expect(component.error()).toBe(true);
    expect(component.mensaje()).toContain('sesión válida');
    expect(component.intento()).toBe(false);
  });

  it('should never store the literal "undefined" as the token', () => {
    component.entrarAlSistema({ access_token: undefined });

    expect(localStorage.getItem('token')).toBeNull();
    expect(component.error()).toBe(true);
  });

  it('should reject a blank token', () => {
    component.entrarAlSistema({ access_token: '   ' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(component.error()).toBe(true);
  });

  it('should store the session when the token is valid', () => {
    component.entrarAlSistema({ access_token: 'un.jwt.valido', user: { login: 'admin' } });

    expect(localStorage.getItem('login')).toBe('true');
    expect(localStorage.getItem('token')).toBe('un.jwt.valido');
    expect(localStorage.getItem('user')).toContain('admin');
    expect(component.error()).toBe(false);
  });
});

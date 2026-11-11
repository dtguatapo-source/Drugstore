import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Dashboard } from './dashboard';

/** JWT sintáctico con vencimiento futuro: el frontend solo lee el claim exp. */
function tokenVigente(segundos = 600): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + segundos }));
  return `cabecera.${payload}.firma`;
}

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    // El dashboard exige sesión: sin token vigente redirige y no se puede montar
    localStorage.setItem('login', 'admin');
    localStorage.setItem('token', tokenVigente());
    localStorage.setItem('user', '{"login":"admin"}');

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should report an active session when the token is still valid', () => {
    expect(component.isLoggedIn()).toBe(true);
  });
});

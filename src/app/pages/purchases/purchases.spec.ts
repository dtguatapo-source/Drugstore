import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Purchases } from './purchases';

describe('Purchases', () => {
  let component: Purchases;
  let fixture: ComponentFixture<Purchases>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Purchases],
      // Sin esto el componente pide HTTP real y whenStable() espera la red
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Purchases);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

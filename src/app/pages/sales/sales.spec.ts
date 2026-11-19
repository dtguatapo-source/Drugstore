import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Sales } from './sales';

describe('Sales', () => {
  let component: Sales;
  let fixture: ComponentFixture<Sales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sales],
      // Sin esto el componente pide HTTP real y whenStable() espera la red
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Sales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should total the cart from the item subtotals', () => {
    component.cart.set([
      { id: 'MED-001', name: 'Ibuprofeno', cantVenta: 2, salePrice: 2500, subtotal: 5000 },
      { id: 'MED-002', name: 'Amoxicilina', cantVenta: 1, salePrice: 1200, subtotal: 1200 }
    ]);

    expect(component.totalCart()).toBe(6200);
  });

  it('should ignore a cart item without a numeric subtotal', () => {
    component.cart.set([
      { id: 'MED-001', name: 'Ibuprofeno', cantVenta: 2, salePrice: 2500, subtotal: 5000 },
      { id: 'MED-003', name: 'Sin precio', cantVenta: 1, salePrice: null, subtotal: null }
    ]);

    expect(component.totalCart()).toBe(5000);
  });
});

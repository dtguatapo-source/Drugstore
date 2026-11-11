import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sales } from './sales';

/** Arma un carrito de una sola línea con el subtotal pedido. */
function carritoConSubtotal(subtotal: number) {
  return [
    { id: 'MED-001', name: 'Ibuprofeno', cantVenta: 2, salePrice: subtotal / 2, subtotal }
  ];
}

describe('Sales', () => {
  let component: Sales;
  let fixture: ComponentFixture<Sales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sales],
    }).compileComponents();

    fixture = TestBed.createComponent(Sales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('descuento', () => {
    it('should leave the total untouched when no discount is applied', () => {
      component.cart.set(carritoConSubtotal(1000));

      expect(component.totalCart()).toBe(1000);
      expect(component.totalACobrar()).toBe(1000);
    });

    it('should allow exactly 50% and never leave the sale at zero', () => {
      component.cart.set(carritoConSubtotal(1000));

      component.setDescuento(500);

      expect(component.discount()).toBe(500);
      expect(component.totalACobrar()).toBe(500);
      expect(component.totalACobrar()).toBeGreaterThan(0);
    });

    it('should clamp any discount above 50% down to the maximum', () => {
      component.cart.set(carritoConSubtotal(1000));
      expect(component.descuentoMaximo()).toBe(500);

      component.setDescuento(600);

      expect(component.discount()).toBe(500);
      expect(component.totalACobrar()).toBe(500);
    });

    it('should reject a negative discount', () => {
      component.cart.set(carritoConSubtotal(1000));

      component.setDescuento(-100);

      expect(component.discount()).toBe(0);
      expect(component.totalACobrar()).toBe(1000);
    });

    it('should ignore a non numeric discount', () => {
      component.setDescuento('no-es-un-numero');

      expect(component.discount()).toBe(0);
    });

    it('should floor the maximum on an odd subtotal', () => {
      component.cart.set(carritoConSubtotal(999));
      expect(component.descuentoMaximo()).toBe(499);

      component.setDescuento(500);

      expect(component.discount()).toBe(499);
      expect(component.totalACobrar()).toBe(500);
    });

    it('should re-clamp the applied discount when the cart shrinks', () => {
      component.cart.set(carritoConSubtotal(1000));
      component.setDescuento(500);

      component.cart.set([]);

      expect(component.descuentoAplicado()).toBe(0);
      expect(component.totalACobrar()).toBe(0);
    });
  });
});

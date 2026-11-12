import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { Medicine } from '../../models/medicine';
import { MedicineService } from '../../services/medicine.service';
import { Inventory, siguienteIdMedicina } from './inventory';

describe('Inventory', () => {
  let component: Inventory;
  let fixture: ComponentFixture<Inventory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inventory],
    }).compileComponents();

    fixture = TestBed.createComponent(Inventory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('siguienteIdMedicina', () => {
  it('debe arrancar en MED-001 cuando el catálogo está vacío', () => {
    expect(siguienteIdMedicina([])).toBe('MED-001');
  });

  it('debe sumar uno al mayor número existente', () => {
    expect(siguienteIdMedicina(['MED-007'])).toBe('MED-008');
  });

  it('debe conservar el relleno de ceros del id más ancho', () => {
    expect(siguienteIdMedicina(['MED-0042'])).toBe('MED-0043');
    expect(siguienteIdMedicina(['MED-0042', 'MED-12'])).toBe('MED-0043');
  });

  it('debe ignorar los ids sin dígitos', () => {
    expect(siguienteIdMedicina(['MED-', 'SIN-CODIGO', 'MED-007'])).toBe('MED-008');
  });

  it('no debe repetir un id que ya existe', () => {
    const existentes = ['MED-003', 'MED-003', 'MED-001'];
    const siguiente = siguienteIdMedicina(existentes);

    expect(siguiente).toBe('MED-004');
    expect(existentes).not.toContain(siguiente);
  });
});

/** Doble del servicio: entrega Subjects para decidir cuándo responde el "backend". */
class MedicineServiceStub {
  readonly medicines$ = new BehaviorSubject<Medicine[]>([]);
  readonly cargando$ = new BehaviorSubject<boolean>(false);
  readonly errorCarga$ = new BehaviorSubject<string>('');

  readonly registro = new Subject<Medicine>();
  readonly registrados: Medicine[] = [];

  loadMedicines(): void {}

  addMedicine(medicamento: Medicine): Observable<Medicine> {
    this.registrados.push(medicamento);
    return this.registro;
  }

  updateMedicine(): Observable<Medicine> {
    return new Subject<Medicine>();
  }

  deleteMedicine(): Observable<void> {
    return new Subject<void>();
  }
}

describe('Inventory (flujo de escritura honesto)', () => {
  let componente: Inventory;
  let doble: MedicineServiceStub;

  const valido = (): Medicine => ({
    id: '',
    name: 'Ibuprofeno',
    laboratory: 'Genfar',
    description: 'Tabletas',
    stock: 10,
    purchasePrice: 1.5,
    salePrice: 2.5
  });

  beforeEach(async () => {
    doble = new MedicineServiceStub();

    await TestBed.configureTestingModule({
      imports: [Inventory],
      providers: [{ provide: MedicineService, useValue: doble }]
    }).compileComponents();

    const fixture = TestBed.createComponent(Inventory);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('no debe anunciar éxito ni limpiar el formulario antes de la respuesta', () => {
    doble.medicines$.next([
      {
        id: 'MED-007',
        name: 'Amoxicilina',
        laboratory: 'Genfar',
        description: '',
        stock: 3,
        purchasePrice: 1,
        salePrice: 2
      }
    ]);

    componente.newMedicine = valido();
    componente.registrar();

    // La petición quedó en vuelo: nada se da por guardado todavía
    expect(componente.guardando()).toBe(true);
    expect(componente.mensaje()).toBe('');
    expect(componente.newMedicine.name).toBe('Ibuprofeno');
    expect(doble.registrados.length).toBe(1);
    expect(doble.registrados[0].id).toBe('MED-008');

    doble.registro.next({ ...doble.registrados[0] });

    expect(componente.guardando()).toBe(false);
    expect(componente.mensaje()).toBe('Guardado con éxito');
    expect(componente.newMedicine.name).toBe('');
  });

  it('debe informar que el ID ya existe cuando el backend responde 409', () => {
    componente.newMedicine = valido();
    componente.registrar();

    doble.registro.error({ status: 409, error: { message: 'El ID ya existe' } });

    expect(componente.guardando()).toBe(false);
    expect(componente.error()).toBe(true);
    expect(componente.mensaje()).toContain('ID');
    expect(componente.mensaje()).toContain('ya existe');
  });

  it('debe rechazar un precio de venta menor al de compra sin llamar al backend', () => {
    componente.newMedicine = { ...valido(), purchasePrice: 5, salePrice: 3 };
    componente.registrar();

    expect(componente.error()).toBe(true);
    expect(componente.mensaje()).toContain('precio de venta');
    expect(componente.guardando()).toBe(false);
    expect(doble.registrados.length).toBe(0);
  });

  it('debe rechazar un nombre en blanco sin llamar al backend', () => {
    componente.newMedicine = { ...valido(), name: '   ' };
    componente.registrar();

    expect(componente.error()).toBe(true);
    expect(componente.mensaje()).toContain('nombre');
    expect(doble.registrados.length).toBe(0);
  });
});

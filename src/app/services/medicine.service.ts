import { Injectable, inject } from '@angular/core'; //  Agregamos inject para usar HttpClient en Angular 21
import { HttpClient } from '@angular/common/http'; //  Importamos HttpClient para conectar con el Backend
import { BehaviorSubject, Observable, defer, map, tap } from 'rxjs';
import { Medicine } from '../models/medicine';
import { mensajeDeError } from '../shared/mensaje-error';

/**
 * Convierte un valor del formulario en número sin inventar ceros.
 *
 * `Number('')` y `Number(null)` devuelven 0, así que un campo vacío parecería
 * válido. Aquí eso es un error explícito en español: preferimos no guardar
 * antes que guardar un precio o un stock falsos.
 */
export function numeroEstricto(valor: unknown, campo: string): number {
  const numero =
    typeof valor === 'number'
      ? valor
      : typeof valor === 'string' && valor.trim() !== ''
      ? Number(valor)
      : NaN;

  if (!Number.isFinite(numero)) {
    throw new Error(`El campo "${campo}" debe ser un número válido.`);
  }

  if (numero < 0) {
    throw new Error(`El campo "${campo}" no puede ser negativo.`);
  }

  return numero;
}

@Injectable({ providedIn: 'root' })
export class MedicineService {
  private http = inject(HttpClient); //  Inyectamos HttpClient
  private apiUrl = 'http://localhost:3000/medicines'; //  Endpoint de medicamentos en NestJS

  //  Empezamos desde cero con un arreglo vacío []; todo vendrá de PostgreSQL
  private medicines = new BehaviorSubject<Medicine[]>([]);
  medicines$ = this.medicines.asObservable();

  //  Estado de la carga: cargando$ avisa que hay una petición en curso y
  //  errorCarga$ guarda el mensaje cuando el backend no responde ('' si no hay error)
  private cargando = new BehaviorSubject<boolean>(false);
  cargando$ = this.cargando.asObservable();

  private errorCarga = new BehaviorSubject<string>('');
  errorCarga$ = this.errorCarga.asObservable();

  constructor() {
    this.loadMedicines(); // Al iniciar el servicio, consulta los medicamentos guardados en la BD
  }

  // Obtiene los medicamentos reales desde PostgreSQL (GET http://localhost:3000/medicines)
  loadMedicines() {
    this.cargando.next(true);
    this.errorCarga.next(''); //  Cada carga arranca sin el error anterior

    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        const adaptados = (data || []).map((m) => this.adaptarDesdeBackend(m));
        this.medicines.next(adaptados); // 👈 Si la BD está vacía, queda en [] listo para que registres desde cero
        this.errorCarga.next('');
        this.cargando.next(false);
      },
      error: (err) => {
        console.error('Error al cargar medicamentos desde el backend:', err);
        //  Sin backend la tabla queda vacía, pero la pantalla avisa del fallo
        this.errorCarga.next(
          mensajeDeError(err, 'No se pudieron cargar los medicamentos.')
        );
        this.cargando.next(false); //  También se apaga cuando la carga falla
      }
    });
  }

  //  Registra un medicamento y devuelve el Observable: quien llama decide qué
  //  mostrar en el éxito y en el error, así la pantalla nunca miente.
  addMedicine(medicine: Medicine): Observable<Medicine> {
    return defer(() => {
      const payload = this.prepararParaBackend(medicine); // Preparamos el DTO que exige NestJS
      return this.http.post<any>(this.apiUrl, payload);
    }).pipe(
      map((creado) => this.adaptarDesdeBackend(creado)),
      tap((adaptado) => {
        //  Solo después de un éxito real se agrega a la tabla y a los selects
        const current = this.medicines.value;
        this.medicines.next([...current, adaptado]);
      })
    );
  }

  //  Elimina un medicamento de PostgreSQL (DELETE http://localhost:3000/medicines/:id)
  deleteMedicine(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        //  Se quita de la tabla solo cuando la BD confirmó el borrado
        const current = this.medicines.value;
        this.medicines.next(current.filter((m) => m.id !== id));
      })
    );
  }

  //  Modifica un medicamento en PostgreSQL (PATCH http://localhost:3000/medicines/:id)
  updateMedicine(updatedMedicine: Medicine): Observable<Medicine> {
    return defer(() => {
      const payload = this.prepararParaBackend(updatedMedicine);
      const { id, ...bodySinId } = payload; // Quitamos id del body porque va en la URL
      return this.http.patch<any>(`${this.apiUrl}/${updatedMedicine.id}`, bodySinId);
    }).pipe(
      map((actualizado) => this.adaptarDesdeBackend(actualizado)),
      tap((adaptado) => {
        const current = [...this.medicines.value];
        const index = current.findIndex((m) => m.id === updatedMedicine.id);
        if (index !== -1) {
          current[index] = adaptado;
          this.medicines.next(current); //  Actualiza la fila en la tabla tras la respuesta
        }
      })
    );
  }

  // Calcula el estado visual para tu tabla en el Frontend
  private calcularEstado(stock: number): 'Activo' | 'Bajo stock' | 'Sin stock' {
    if (stock <= 0) return 'Sin stock';
    if (stock < 20) return 'Bajo stock';
    return 'Activo';
  }

  // Traduce el stock al enum EstadoMedicamento ('DISPONIBLE' | 'AGOTADO' | 'VENCIDO') que pide Prisma
  private calcularEstadoBackend(stock: number): 'DISPONIBLE' | 'AGOTADO' | 'VENCIDO' {
    return stock > 0 ? 'DISPONIBLE' : 'AGOTADO';
  }

  //  El backend decide si un medicamento está vencido (allí vive expiryDate);
  //  aquí solo lo respetamos en vez de recalcularlo con el stock.
  private estadoDesdeBackend(status: unknown, stock: number): Medicine['status'] {
    if (typeof status === 'string' && status.trim().toUpperCase() === 'VENCIDO') {
      return 'Vencido';
    }

    return this.calcularEstado(stock);
  }

  // Arma el objeto con los tipos exactos que valida CreateMedicineDto en NestJS
  private prepararParaBackend(medicine: Medicine) {
    const stockNum = numeroEstricto(medicine.stock, 'stock');
    const purchasePrice = numeroEstricto(medicine.purchasePrice, 'precio de compra');
    const salePrice = numeroEstricto(medicine.salePrice, 'precio de venta');
    const keywordsStr = Array.isArray(medicine.keywords)
      ? medicine.keywords.join(', ')
      : medicine.keywords || '';

    return {
      id: medicine.id.trim(),
      name: medicine.name.trim(),
      laboratory: medicine.laboratory.trim(),
      category: medicine.category || 'General',
      description: medicine.description?.trim() || 'Sin descripción',
      keywords: keywordsStr,
      stock: stockNum,
      purchasePrice,
      salePrice,
      status: this.calcularEstadoBackend(stockNum)
    };
  }

  //  Convierte los datos que llegan de Prisma (Decimal/String) al formato de tu interfaz Medicine
  private adaptarDesdeBackend(m: any): Medicine {
    const stockNum = Number(m.stock) || 0;
    const keywordsArr =
      typeof m.keywords === 'string'
        ? m.keywords
            .split(',')
            .map((k: string) => k.trim())
            .filter(Boolean)
        : Array.isArray(m.keywords)
        ? m.keywords
        : [];

    return {
      id: m.id,
      name: m.name,
      laboratory: m.laboratory,
      category: m.category || '',
      description: m.description || '',
      keywords: keywordsArr,
      stock: stockNum,
      purchasePrice: Number(m.purchasePrice) || 0,
      salePrice: Number(m.salePrice) || 0,
      status: this.estadoDesdeBackend(m.status, stockNum)
    };
  }

  // Devuelve el valor actual del inventario
  getMedicinesValue(): Medicine[] {
    return this.medicines.value;
  }
}

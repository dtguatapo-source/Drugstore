import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Supplier, SupplierPayload } from '../models/supplier';
import { mensajeDeError } from '../shared/mensaje-error';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/suppliers';

  private readonly suppliers = new BehaviorSubject<Supplier[]>([]);
  readonly suppliers$ = this.suppliers.asObservable();

  // Estado de la carga (S7): '' en errorCarga$ significa "sin error"
  private readonly cargando = new BehaviorSubject<boolean>(false);
  readonly cargando$ = this.cargando.asObservable();

  private readonly errorCarga = new BehaviorSubject<string>('');
  readonly errorCarga$ = this.errorCarga.asObservable();

  constructor() {
    // Igual que el resto de los servicios: carga inicial desde PostgreSQL
    this.refrescar();
  }

  // GET http://localhost:3000/suppliers
  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((data) => (data || []).map((proveedor) => this.adaptar(proveedor))),
      tap((lista) => this.suppliers.next(lista))
    );
  }

  // POST http://localhost:3000/suppliers
  createSupplier(proveedor: SupplierPayload): Observable<Supplier> {
    return this.http.post<any>(this.apiUrl, proveedor).pipe(
      map((creado) => this.adaptar(creado)),
      tap(() => this.refrescar())
    );
  }

  // PATCH http://localhost:3000/suppliers/:id
  updateSupplier(proveedor: Supplier): Observable<Supplier> {
    const { id, ...body } = proveedor;

    return this.http.patch<any>(`${this.apiUrl}/${id}`, body).pipe(
      map((actualizado) => this.adaptar(actualizado)),
      tap(() => this.refrescar())
    );
  }

  // DELETE http://localhost:3000/suppliers/:id
  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(tap(() => this.refrescar()));
  }

  // Fuerza una recarga y mantiene sincronizado a quien escuche suppliers$
  recargar(): void {
    this.refrescar();
  }

  private refrescar(): void {
    this.cargando.next(true);
    this.errorCarga.next(''); // Cada carga arranca sin el error anterior

    this.getSuppliers().subscribe({
      next: () => {
        this.errorCarga.next('');
        this.cargando.next(false);
      },
      error: (err) => {
        console.error('Error al cargar proveedores desde el backend:', err);
        // Sin backend la tabla queda vacía, pero la pantalla avisa del fallo
        this.errorCarga.next(mensajeDeError(err, 'No se pudieron cargar los proveedores.'));
        this.cargando.next(false); // También se apaga cuando la carga falla
      }
    });
  }

  // El backend puede devolver los campos opcionales como null
  private adaptar(proveedor: any): Supplier {
    return {
      id: Number(proveedor.id),
      nit: proveedor.nit ?? '',
      name: proveedor.name ?? '',
      phone: proveedor.phone ?? '',
      email: proveedor.email ?? '',
      address: proveedor.address ?? ''
    };
  }
}

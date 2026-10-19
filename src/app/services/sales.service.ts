import { Injectable, inject } from '@angular/core'; // 👈 Agregamos inject para usar HttpClient
import { HttpClient } from '@angular/common/http'; // 👈 Importamos HttpClient para conectar con NestJS
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators'; // 👈 Operadores para encadenar Cliente -> Venta
import { Sale } from '../models/sale';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private http = inject(HttpClient); // 👈 Inyectamos HttpClient
  private salesUrl = 'http://localhost:3000/sales'; // 👈 Endpoint de ventas en NestJS
  private customersUrl = 'http://localhost:3000/customers'; // 👈 Endpoint de clientes en NestJS

  private _sales = new BehaviorSubject<Sale[]>([]);
  sales$ = this._sales.asObservable();

  constructor() {
    this.loadSales(); // 👈 Al iniciar el servicio, cargamos las ventas reales desde PostgreSQL
  }

  // 👈 Obtiene todas las ventas de PostgreSQL (GET http://localhost:3000/sales)
  loadSales() {
    this.http.get<any[]>(this.salesUrl).subscribe({
      next: (data) => {
        const listaPlana: Sale[] = [];
        (data || []).forEach((venta) => {
          const fechaVenta = venta.date ? new Date(venta.date) : new Date();
          (venta.items || []).forEach((item: any) => {
            listaPlana.push({
              id: Number(item.id || venta.id),
              medicineId: item.medicineId,
              quantity: Number(item.quantity),
              total: Number(item.subtotal),
              date: fechaVenta
            });
          });
        });
        this._sales.next(listaPlana);
      },
      error: (err) => {
        console.error('Error al cargar ventas desde el backend:', err);
      }
    });
  }

  // 👈 Busca si el cliente ya existe por documento o nombre; si no existe, lo crea en PostgreSQL
  private obtenerOCrearClienteId(
    nombreCliente: string,
    documentoCliente: string
  ): Observable<number | undefined> {
    const nombreLimpio = (nombreCliente || '').trim();
    const docLimpio = (documentoCliente || '').trim();

    // Si el usuario dejó ambos campos vacíos, enviamos la venta sin cliente (customerId es opcional en NestJS)
    if (!nombreLimpio && !docLimpio) {
      return of(undefined);
    }

    // CreateCustomerDto exige que name tenga mínimo 3 caracteres (@MinLength(3)) e idNumber no esté vacío
    const nombreFinal =
      nombreLimpio.length >= 3 ? nombreLimpio : 'Cliente General';
    const docFinal = docLimpio || `DOC-${Date.now()}`;

    return this.http.get<any[]>(this.customersUrl).pipe(
      switchMap((clientes) => {
        const existente = (clientes || []).find(
          (c) =>
            (docLimpio && c.idNumber?.trim() === docLimpio) ||
            (nombreLimpio &&
              c.name?.toLowerCase().trim() === nombreLimpio.toLowerCase())
        );

        // Si el cliente ya está registrado en la tabla customers, usamos su ID
        if (existente) {
          return of(Number(existente.id));
        }

        // 👈 Si no existe, lo creamos en POST http://localhost:3000/customers
        return this.http
          .post<any>(this.customersUrl, {
            name: nombreFinal,
            idNumber: docFinal
          })
          .pipe(
            map((creado) => Number(creado.id)),
            catchError(() => of(undefined))
          );
      }),
      catchError(() => of(undefined))
    );
  }

  // 👈 Registra primero el Cliente (si se ingresó) y luego la Venta en POST http://localhost:3000/sales
  registrarVentaEnBackend(
    customer: { name: string; idNumber: string; date?: string },
    cartItems: any[],
    discount: number = 0
  ): Observable<any> {
    return this.obtenerOCrearClienteId(customer.name, customer.idNumber).pipe(
      switchMap((customerId) => {
        // 👈 Armamos el objeto exacto que exige CreateSaleDto en tu Backend NestJS
        const createSaleDto: any = {
          discount: Number(discount) || 0,
          items: cartItems.map((item) => ({
            medicineId: String(item.id),
            quantity: Number(item.cantVenta)
          }))
        };

        if (customerId) {
          createSaleDto.customerId = customerId;
        }

        return this.http.post<any>(this.salesUrl, createSaleDto);
      }),
      tap(() => {
        // 👈 Actualizamos el historial de ventas tras guardar en PostgreSQL
        this.loadSales();
      })
    );
  }

  // Mantenemos este método por compatibilidad
  addSale(sale: Sale) {
    const current = this._sales.getValue();
    this._sales.next([...current, sale]);
  }
}
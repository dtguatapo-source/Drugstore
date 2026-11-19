import { Injectable, inject } from '@angular/core'; 
import { HttpClient } from '@angular/common/http'; 
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators'; 
import { Purchase } from '../models/purchase';
import { mensajeDeError } from '../shared/mensaje-error';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private http = inject(HttpClient); //Inyectamos HttpClient
  private purchasesUrl = `${environment.apiBase}/purchases`; 
  private suppliersUrl = `${environment.apiBase}/suppliers`; 

  private purchases = new BehaviorSubject<Purchase[]>([]);
  purchases$ = this.purchases.asObservable();

  // Estado de la carga (S7): '' en errorCarga$ significa "sin error"
  private cargando = new BehaviorSubject<boolean>(false);
  cargando$ = this.cargando.asObservable();

  private errorCarga = new BehaviorSubject<string>('');
  errorCarga$ = this.errorCarga.asObservable();

  constructor() {
    this.loadPurchases(); 
  }

  loadPurchases() {
    this.cargando.next(true);
    this.errorCarga.next(''); // Cada carga arranca sin el error anterior

    this.http.get<any[]>(this.purchasesUrl).subscribe({
      next: (data) => {
        const listaPlana: Purchase[] = [];
        (data || []).forEach((compra) => {
          const fechaStr = compra.date ? String(compra.date).split('T')[0] : '';
          const nombreProveedor = compra.supplier?.name || 'Proveedor';

          (compra.items || []).forEach((item: any) => {
            listaPlana.push({
              id: String(item.id || compra.id),
              date: fechaStr,
              provider: nombreProveedor,
              invoiceNumber: compra.invoiceNumber,
              medicineId: item.medicineId,
              quantity: Number(item.quantity),
              purchasePrice: Number(item.purchasePrice),
              salePrice: Number(item.salePrice),
              expiryDate: item.expiryDate ? String(item.expiryDate).split('T')[0] : undefined,
              total: Number(item.total)
            });
          });
        });
        this.purchases.next(listaPlana);
        this.errorCarga.next('');
        this.cargando.next(false);
      },
      error: (err) => {
        console.error('Error al cargar compras desde el backend:', err);
        // Sin backend la lista queda vacía, pero la pantalla avisa del fallo
        this.errorCarga.next(mensajeDeError(err, 'No se pudieron cargar las compras.'));
        this.cargando.next(false); // También se apaga cuando la carga falla
      }
    });
  }

  private obtenerOCrearProveedorId(nombreProveedor: string): Observable<number> {
    const nombreLimpio = nombreProveedor.trim();

    return this.http.get<any[]>(this.suppliersUrl).pipe(
      switchMap((proveedores) => {
        const existente = (proveedores || []).find(
          (s) => s.name?.toLowerCase().trim() === nombreLimpio.toLowerCase()
        );

        if (existente) {
          return of(Number(existente.id));
        }

        const nuevoProveedorDto = {
          name: nombreLimpio,
          nit: `NIT-${Date.now()}`
        };

        return this.http.post<any>(this.suppliersUrl, nuevoProveedorDto).pipe(
          map((creado) => Number(creado.id))
        );
      })
    );
  }

  registrarCompraEnBackend(
    providerName: string,
    invoiceNumber: string,
    itemsTabla: any[],
    supplierId?: number
  ): Observable<any> {
    // Si el usuario ya eligio un proveedor registrado, lo usamos tal cual
    const proveedor$ = supplierId ? of(supplierId) : this.obtenerOCrearProveedorId(providerName);

    return proveedor$.pipe(
      switchMap((idProveedor) => {
        const createPurchaseDto = {
          supplierId: idProveedor,
          invoiceNumber: invoiceNumber.trim(),
          items: itemsTabla.map((item) => ({
            medicineId: String(item.medicineId),
            quantity: Number(item.quantity),
            purchasePrice: Number(item.purchasePrice),
            salePrice: Number(item.salePrice)
          }))
        };

        return this.http.post<any>(this.purchasesUrl, createPurchaseDto);
      }),
      tap(() => {
        this.loadPurchases();
      })
    );
  }

  addPurchase(purchase: Purchase) {
    const current = this.purchases.value;
    this.purchases.next([...current, purchase]);
  }
}
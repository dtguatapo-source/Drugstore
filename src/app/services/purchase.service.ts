import { Injectable, inject } from '@angular/core'; 
import { HttpClient } from '@angular/common/http'; 
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators'; 
import { Purchase } from '../models/purchase';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private http = inject(HttpClient); //Inyectamos HttpClient
  private purchasesUrl = 'http://localhost:3000/purchases'; 
  private suppliersUrl = 'http://localhost:3000/suppliers'; 

  private purchases = new BehaviorSubject<Purchase[]>([]);
  purchases$ = this.purchases.asObservable();

  constructor() {
    this.loadPurchases(); 
  }

  loadPurchases() {
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
      },
      error: (err) => {
        console.error('Error al cargar compras desde el backend:', err);
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
    itemsTabla: any[]
  ): Observable<any> {
    return this.obtenerOCrearProveedorId(providerName).pipe(
      switchMap((supplierId) => {
        const createPurchaseDto = {
          supplierId: supplierId,
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
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Purchase } from '../models/purchase'; // 

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {

  private purchases = new BehaviorSubject<Purchase[]>([]);
  purchases$ = this.purchases.asObservable();

  addPurchase(purchase: Purchase) {
    const current = this.purchases.value;
    this.purchases.next([...current, purchase]);
  }
}
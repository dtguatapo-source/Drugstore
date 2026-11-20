import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Inventory } from './pages/inventory/inventory';
import { Sales } from './pages/sales/sales';
import { Purchases } from './pages/purchases/purchases';
import { Reports } from './pages/reports/reports';
import { Suppliers } from './pages/suppliers/suppliers';
import { authGuard } from './pages/auth.guard/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'inventory', component: Inventory, canActivate: [authGuard] },
  { path: 'sales', component: Sales, canActivate: [authGuard] },
  { path: 'purchases', component: Purchases, canActivate: [authGuard] },
  { path: 'suppliers', component: Suppliers, canActivate: [authGuard] },
  { path: 'reports', component: Reports, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];

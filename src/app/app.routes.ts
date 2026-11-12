import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Inventory } from './pages/inventory/inventory';
import { Sales } from './pages/sales/sales';
import { Purchases } from './pages/purchases/purchases';
import { Reports } from './pages/reports/reports';
import { Register } from './pages/register/register';
import { Suppliers } from './pages/suppliers/suppliers';
import { authGuard } from './pages/auth.guard/auth.guard';
import { roleGuard } from './pages/auth.guard/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'inventory', component: Inventory, canActivate: [authGuard, roleGuard('ADMIN')] },
  { path: 'sales', component: Sales, canActivate: [authGuard] },
  { path: 'purchases', component: Purchases, canActivate: [authGuard, roleGuard('ADMIN')] },
  { path: 'suppliers', component: Suppliers, canActivate: [authGuard, roleGuard('ADMIN')] },
  { path: 'reports', component: Reports, canActivate: [authGuard, roleGuard('ADMIN')] },
  { path: '**', redirectTo: 'login' }
];

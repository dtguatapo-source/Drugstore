import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Medicine } from '../../models/medicine';
import { MedicineService } from '../../services/medicine.service';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  private readonly router = inject(Router);
  private readonly medicineService = inject(MedicineService);
  private readonly salesService = inject(SalesService);

  // Estado reactivo usando Signals según la guía de Angular 21
  readonly isLoggedIn = signal<boolean>(!!localStorage.getItem('login'));

  private readonly medicamentos = toSignal(this.medicineService.medicines$, {
    initialValue: [] as Medicine[]
  });

  // Resumen rápido del día
  readonly ventasHoy = toSignal(this.salesService.todayCount$, { initialValue: 0 });
  readonly totalCatalogo = computed(() => this.medicamentos().length);
  readonly alertasStock = computed(
    () => this.medicamentos().filter((m) => Number(m.stock) < 20).length
  );

  constructor() {
    // Si no hay sesión activa, redirige al login
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  salir(): void {
    localStorage.removeItem('login');
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }
}

import { Component, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  private readonly platformId = inject(PLATFORM_ID);

  // Estado reactivo usando Signals según la guía de Angular 21.
  // localStorage solo existe en el navegador: durante el prerender SSR
  // se arranca sin sesión para no romper el build.
  readonly isLoggedIn = signal<boolean>(
    isPlatformBrowser(this.platformId) ? !!localStorage.getItem('login') : false
  );

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
    // Si no hay sesión activa, redirige al login (solo en el navegador)
    if (isPlatformBrowser(this.platformId) && !this.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  salir(): void {
    localStorage.removeItem('login');
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }
}

import { Component, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Medicine } from '../../models/medicine';
import { MedicineService } from '../../services/medicine.service';
import { SalesService } from '../../services/sales.service';
import { EstadoCarga } from '../../shared/estado-carga/estado-carga';
import { esTokenVigente, limpiarSesion } from '../auth.guard/auth.guard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, EstadoCarga],
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
    isPlatformBrowser(this.platformId)
      ? !!localStorage.getItem('login') && esTokenVigente(localStorage.getItem('token'))
      : false
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

  // Estado de la carga de los indicadores (S7): sin backend los ceros no son reales
  private readonly cargandoMedicamentos = toSignal(this.medicineService.cargando$, {
    initialValue: false
  });
  private readonly cargandoVentas = toSignal(this.salesService.cargando$, { initialValue: false });
  private readonly errorMedicamentos = toSignal(this.medicineService.errorCarga$, {
    initialValue: ''
  });
  private readonly errorVentas = toSignal(this.salesService.errorCarga$, { initialValue: '' });

  readonly cargando = computed(() => this.cargandoMedicamentos() || this.cargandoVentas());
  readonly errorCarga = computed(() => this.errorMedicamentos() || this.errorVentas());

  // Vuelve a pedir el catálogo y el resumen del día a PostgreSQL
  reintentar(): void {
    this.medicineService.loadMedicines();
    this.salesService.loadSales();
  }

  constructor() {
    // Si no hay sesión activa, redirige al login (solo en el navegador)
    if (isPlatformBrowser(this.platformId) && !this.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  salir(): void {
    limpiarSesion();
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }
}

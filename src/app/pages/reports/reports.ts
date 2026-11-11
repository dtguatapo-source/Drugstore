import { Component, inject, signal, computed, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { take, timeout, finalize } from 'rxjs/operators';
import { SalesService } from '../../services/sales.service';
import { MedicineService } from '../../services/medicine.service';
import { Sale } from '../../models/sale';
import { Medicine } from '../../models/medicine';
import * as XLSX from 'xlsx';

export interface ReportSummary {
  sales: { total: number; count: number; items: number };
  purchases: { total: number; count: number; items: number };
  lowStock: number;
}

export interface SalesByDateItem {
  date: string;
  total: number;
  count: number;
}

export interface TopMedicineItem {
  medicineId: string;
  name: string | null;
  laboratory: string | null;
  quantity: number;
  total: number;
}

const API_URL = 'http://localhost:3000/reports';
const REQUEST_TIMEOUT = 8000;

const EMPTY_SUMMARY: ReportSummary = {
  sales: { total: 0, count: 0, items: 0 },
  purchases: { total: 0, count: 0, items: 0 },
  lowStock: 0
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [RouterModule, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class Reports {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly salesService = inject(SalesService);
  private readonly medicineService = inject(MedicineService);

  readonly mensaje = signal<string>('');
  readonly error = signal<boolean>(false);
  readonly medicines = signal<Medicine[]>([]);
  readonly filteredMedicines = signal<Medicine[]>([]);
  readonly selectedMedicine = signal<Medicine | undefined>(undefined);
  readonly filteredSales = signal<Sale[]>([]);
  readonly reporteGenerado = signal<boolean>(false);

  readonly summary = signal<ReportSummary>(EMPTY_SUMMARY);
  readonly salesByDate = signal<SalesByDateItem[]>([]);
  readonly topMedicines = signal<TopMedicineItem[]>([]);
  readonly cargando = signal<boolean>(false);
  readonly errorCarga = signal<boolean>(false);

  readonly balance = computed(() => this.summary().sales.total - this.summary().purchases.total);

  readonly balanceLabel = computed(() => {
    const valor = this.balance();
    return `${valor < 0 ? '-' : ''}$${Math.abs(valor).toLocaleString('es-AR')}`;
  });

  readonly maxDailySale = computed(() => {
    const items = this.salesByDate();
    if (!items.length) return 1;
    return Math.max(...items.map((i) => i.total), 1);
  });

  searchText = '';
  fechaDesde = '';
  fechaHasta = '';

  private pendientes = 0;
  private timeoutRef: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.medicineService.medicines$.subscribe((data) => this.medicines.set(data));

    if (isPlatformBrowser(this.platformId)) {
      this.cargarEstadisticasBackend();
    }

    this.destroyRef.onDestroy(() => {
      if (this.timeoutRef) clearTimeout(this.timeoutRef);
    });
  }

  cargarEstadisticasBackend(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.pendientes = 3;

    this.pedir<ReportSummary>('summary', (res) => this.summary.set(res ?? EMPTY_SUMMARY));
    this.pedir<SalesByDateItem[]>('sales-by-date', (res) => this.salesByDate.set(res ?? []));
    this.pedir<TopMedicineItem[]>('top-medicines', (res) => this.topMedicines.set(res ?? []));
  }

  private pedir<T>(ruta: string, aplicar: (res: T) => void): void {
    this.http
      .get<T>(`${API_URL}/${ruta}`)
      .pipe(
        timeout(REQUEST_TIMEOUT),
        finalize(() => this.finalizarPeticion())
      )
      .subscribe({
        next: aplicar,
        error: () => this.errorCarga.set(true)
      });
  }

  private finalizarPeticion(): void {
    this.pendientes = Math.max(0, this.pendientes - 1);
    if (this.pendientes === 0) this.cargando.set(false);
  }

  getBarWidth(total: number): number {
    return Math.max(8, Math.round((total / this.maxDailySale()) * 100));
  }

  /**
   * Formatea una fecha ISO (YYYY-MM-DD) sin pasar por Date, para no
   * desplazar el día en zonas horarias negativas (UTC-3).
   */
  formatFecha(iso: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
    return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso ?? '');
  }

  mostrarAlerta(msg: string, esError: boolean = false): void {
    this.mensaje.set(msg);
    this.error.set(esError);
    if (this.timeoutRef) clearTimeout(this.timeoutRef);
    this.timeoutRef = setTimeout(() => this.mensaje.set(''), 2500);
  }

  cerrarAlerta(): void {
    this.mensaje.set('');
  }

  exportarExcel(): void {
    const tieneFiltro = this.filteredSales().length > 0;
    const filas = tieneFiltro
      ? this.filteredSales().map((s) => ({
          'Fecha de Venta': new Date(s.date).toLocaleDateString(),
          Medicamento: this.getMedicineName(s.medicineId),
          'Cantidad Vendida': s.quantity,
          'Total de Venta': s.total
        }))
      : this.topMedicines().map((t) => ({
          Código: t.medicineId,
          Medicamento: t.name ?? t.medicineId,
          Laboratorio: t.laboratory ?? 'General',
          'Unidades Vendidas': t.quantity,
          'Total Recaudado': t.total
        }));

    if (filas.length === 0) {
      this.mostrarAlerta('No hay datos para exportar', true);
      return;
    }

    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Reporte de Ventas');
    XLSX.writeFile(libro, 'Reporte_Ventas_Drogueria.xlsx');
    this.mostrarAlerta('Archivo Excel generado con éxito');
  }

  onSearch(): void {
    this.selectedMedicine.set(undefined);
    const termino = this.normalizar(this.searchText);
    if (termino.length > 1) {
      const filtrados = this.medicines().filter((m) => this.normalizar(m.name).includes(termino));
      this.filteredMedicines.set(filtrados);
    } else {
      this.filteredMedicines.set([]);
    }
  }

  selectMed(med: Medicine): void {
    this.selectedMedicine.set(med);
    this.searchText = med.name;
    this.filteredMedicines.set([]);
  }

  getMedicineName(id: string): string {
    const med = this.medicines().find((m) => m.id === id);
    return med ? med.name : 'Producto';
  }

  generarReporte(): void {
    const med = this.selectedMedicine();
    if (!med) {
      this.mostrarAlerta('Debes seleccionar un medicamento', true);
      return;
    }

    if ((this.fechaDesde && !this.fechaHasta) || (!this.fechaDesde && this.fechaHasta)) {
      this.mostrarAlerta('Debes seleccionar ambas fechas', true);
      return;
    }

    if (this.fechaDesde && this.fechaHasta) {
      const desde = new Date(this.fechaDesde);
      const hasta = new Date(this.fechaHasta);
      if (desde > hasta) {
        this.mostrarAlerta('La fecha "Desde" no puede ser mayor que "Hasta"', true);
        return;
      }
    }

    const desde = this.fechaDesde ? new Date(this.fechaDesde + 'T00:00:00') : null;
    const hasta = this.fechaHasta ? new Date(this.fechaHasta + 'T23:59:59') : null;
    const idSeleccionado = med.id;

    this.salesService.sales$.pipe(take(1)).subscribe((allSales) => {
      const resultados = allSales.filter((s) => {
        const coincideMed = s.medicineId === idSeleccionado;
        const fechaVenta = new Date(s.date);
        const coincideFecha = (!desde || fechaVenta >= desde) && (!hasta || fechaVenta <= hasta);
        return coincideMed && coincideFecha;
      });

      this.filteredSales.set(resultados);
      this.reporteGenerado.set(true);

      if (resultados.length === 0) {
        this.mostrarAlerta('No se encontraron datos', true);
      } else {
        this.mostrarAlerta('Reporte generado');
      }
    });
  }

  limpiarFiltros(): void {
    this.searchText = '';
    this.selectedMedicine.set(undefined);
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.filteredSales.set([]);
    this.reporteGenerado.set(false);
    this.filteredMedicines.set([]);
  }

  private normalizar(valor: string): string {
    return (valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}

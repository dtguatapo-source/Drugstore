import { Component, inject, signal, computed, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser, DecimalPipe } from '@angular/common';
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

/** Fila de la tabla general / filtrada de movimientos. */
export interface MovimientoRow {
  id: number | string;
  dia: string;
  medicamento: string;
  cantidad: number;
  total: number;
}

/** Movimiento mínimo necesario para filtrar y agrupar (sirve para ventas y, más adelante, compras). */
export interface MovimientoFiltrable {
  medicineId: string;
  quantity: number;
  total: number;
  date: Date | string;
}

/** Criterio de filtro del reporte (medicamento y/o rango de días ISO). */
export interface CriterioMovimientos {
  medicineId?: string;
  desde?: string;
  hasta?: string;
}

const API_URL = 'http://localhost:3000/reports';
const REQUEST_TIMEOUT = 8000;
const RECIENTES_MAX = 10;

const EMPTY_SUMMARY: ReportSummary = {
  sales: { total: 0, count: 0, items: 0 },
  purchases: { total: 0, count: 0, items: 0 },
  lowStock: 0
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [RouterModule, FormsModule, DecimalPipe],
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

  /** Historial de ventas del servicio, usado para la tabla y el agregado en el navegador. */
  readonly sales = signal<Sale[]>([]);

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
    const items = this.chartData();
    if (!items.length) return 1;
    return Math.max(...items.map((i) => i.total), 1);
  });

  /**
   * Datos de la gráfica: la vista general usa /reports/sales-by-date y, con filtro
   * activo, se agregan las ventas filtradas por día calendario en el navegador.
   */
  readonly chartData = computed<SalesByDateItem[]>(() =>
    this.reporteGenerado() ? this.agruparPorDia(this.filteredSales()) : this.salesByDate()
  );

  /** Últimos movimientos de toda la droguería (vista general, sin filtro). */
  readonly filasGenerales = computed<MovimientoRow[]>(() =>
    this.ultimosMovimientos(this.sales()).map((venta) => this.filaDeVenta(venta))
  );

  /** Filas de la única tabla: general cuando no hay filtro, filtradas cuando lo hay. */
  readonly filasVisibles = computed<MovimientoRow[]>(() =>
    this.reporteGenerado()
      ? this.ordenarPorFechaDesc(this.filteredSales()).map((venta) => this.filaDeVenta(venta))
      : this.filasGenerales()
  );

  readonly tituloTabla = computed(() =>
    this.reporteGenerado() ? 'Detalle de Ventas Filtradas' : 'Registros Recientes'
  );

  readonly notaTabla = computed(() => {
    const cantidad = this.filasVisibles().length;
    return this.reporteGenerado()
      ? `${cantidad} movimiento(s) para el filtro aplicado.`
      : `Resumen de los últimos ${RECIENTES_MAX} movimientos registrados.`;
  });

  readonly mensajeVacio = computed(() =>
    this.reporteGenerado()
      ? 'No hay ventas registradas para este filtro.'
      : 'Todavía no hay ventas registradas.'
  );

  searchText = '';
  fechaDesde = '';
  fechaHasta = '';

  private pendientes = 0;
  private timeoutRef: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.medicineService.medicines$.subscribe((data) => this.medicines.set(data));
    this.salesService.sales$.subscribe((data) => this.sales.set(data));

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

  /** El rango es inválido cuando "Desde" es posterior a "Hasta". */
  rangoInvalido(): boolean {
    return !!this.fechaDesde && !!this.fechaHasta && this.fechaDesde > this.fechaHasta;
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
    const tieneFiltro = this.reporteGenerado();
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

  // ===== Helpers puros de agregación (reutilizables para el modo Compras) =====

  /**
   * Día calendario en ISO local (YYYY-MM-DD). Nunca construye un Date a partir
   * de un string YYYY-MM-DD, para no desplazar el día en zonas horarias negativas.
   */
  diaISO(fecha: Date | string): string {
    if (typeof fecha === 'string') {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
      if (m) return `${m[1]}-${m[2]}-${m[3]}`;
      const parseada = new Date(fecha);
      return Number.isNaN(parseada.getTime()) ? '' : this.diaISO(parseada);
    }

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  /** Agrupa movimientos por día calendario, con el total y la cantidad del día. */
  agruparPorDia(movimientos: MovimientoFiltrable[]): SalesByDateItem[] {
    const acumulado = new Map<string, { total: number; count: number }>();

    (movimientos ?? []).forEach((movimiento) => {
      const dia = this.diaISO(movimiento.date);
      if (!dia) return;
      const actual = acumulado.get(dia) ?? { total: 0, count: 0 };
      actual.total += Number(movimiento.total) || 0;
      actual.count += 1;
      acumulado.set(dia, actual);
    });

    return Array.from(acumulado.entries())
      .map(([date, valor]) => ({ date, total: valor.total, count: valor.count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Filtra movimientos por medicamento y/o rango de días ISO (extremos incluidos).
   * Sin criterio devuelve la lista completa, así que sirve también para la vista general.
   */
  filtrarMovimientos<T extends MovimientoFiltrable>(
    movimientos: T[],
    criterio: CriterioMovimientos = {}
  ): T[] {
    const { medicineId, desde, hasta } = criterio;

    return (movimientos ?? []).filter((movimiento) => {
      if (medicineId && movimiento.medicineId !== medicineId) return false;
      const dia = this.diaISO(movimiento.date);
      if (desde && dia < desde) return false;
      if (hasta && dia > hasta) return false;
      return true;
    });
  }

  /** Movimientos más recientes primero, acotados a un máximo. */
  ultimosMovimientos<T extends MovimientoFiltrable>(
    movimientos: T[],
    maximo: number = RECIENTES_MAX
  ): T[] {
    return this.ordenarPorFechaDesc(movimientos).slice(0, maximo);
  }

  /** Orden descendente por fecha, sin perder los movimientos del mismo día. */
  ordenarPorFechaDesc<T extends MovimientoFiltrable>(movimientos: T[]): T[] {
    return [...(movimientos ?? [])].sort((a, b) => {
      const diaA = this.diaISO(a.date);
      const diaB = this.diaISO(b.date);
      if (diaA !== diaB) return diaB.localeCompare(diaA);
      return 0;
    });
  }

  /** Convierte una venta del historial en una fila mostrable de la tabla. */
  filaDeVenta(venta: Sale): MovimientoRow {
    return {
      id: venta.id,
      dia: this.diaISO(venta.date),
      medicamento: this.getMedicineName(venta.medicineId),
      cantidad: Number(venta.quantity) || 0,
      total: Number(venta.total) || 0
    };
  }

  generarReporte(): void {
    const med = this.selectedMedicine();
    const desde = this.fechaDesde;
    const hasta = this.fechaHasta;

    // Se puede filtrar solo por medicamento, solo por rango de fechas o por ambos.
    if (!med && !desde && !hasta) {
      this.mostrarAlerta('Selecciona un medicamento o un rango de fechas', true);
      return;
    }

    if ((desde && !hasta) || (!desde && hasta)) {
      this.mostrarAlerta('Debes seleccionar ambas fechas', true);
      return;
    }

    if (this.rangoInvalido()) {
      this.mostrarAlerta('La fecha "Desde" no puede ser mayor que "Hasta"', true);
      return;
    }

    this.salesService.sales$.pipe(take(1)).subscribe((allSales) => {
      const resultados = this.filtrarMovimientos(allSales, {
        medicineId: med?.id,
        desde,
        hasta
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

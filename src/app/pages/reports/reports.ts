import { Component, inject, signal, computed, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { take, timeout, finalize } from 'rxjs/operators';
import { SalesService } from '../../services/sales.service';
import { MedicineService } from '../../services/medicine.service';
import { PurchaseService } from '../../services/purchase.service';
import { Sale } from '../../models/sale';
import { Medicine } from '../../models/medicine';
import { Purchase } from '../../models/purchase';
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

/** Modo activo del informe. */
export type ModoInforme = 'ventas' | 'compras';

/** Fila de la tabla general / filtrada de ventas. */
export interface MovimientoRow {
  id: number | string;
  dia: string;
  medicamento: string;
  cantidad: number;
  total: number;
}

/** Fila de la tabla general / filtrada de compras. */
export interface CompraRow {
  id: string;
  dia: string;
  proveedor: string;
  medicamento: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

/** Fila tal como se escribe en el Excel exportado. */
export type FilaExportable = Record<string, string | number>;

/** Movimiento mínimo necesario para filtrar y agrupar (sirve para ventas y compras). */
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
const TOP_MAX = 5;

const EMPTY_SUMMARY: ReportSummary = {
  sales: { total: 0, count: 0, items: 0 },
  purchases: { total: 0, count: 0, items: 0 },
  lowStock: 0
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [RouterModule, FormsModule, DecimalPipe, NgTemplateOutlet],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class Reports {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly salesService = inject(SalesService);
  private readonly medicineService = inject(MedicineService);
  private readonly purchaseService = inject(PurchaseService);

  readonly mensaje = signal<string>('');
  readonly error = signal<boolean>(false);
  readonly medicines = signal<Medicine[]>([]);
  readonly filteredMedicines = signal<Medicine[]>([]);
  readonly selectedMedicine = signal<Medicine | undefined>(undefined);
  readonly filteredSales = signal<Sale[]>([]);
  readonly filteredCompras = signal<Purchase[]>([]);
  readonly reporteGenerado = signal<boolean>(false);

  /** Modo del informe: define qué KPIs, gráficas, tabla y exportación se muestran. */
  readonly modo = signal<ModoInforme>('ventas');

  /** Historial de ventas del servicio, usado para la tabla y el agregado en el navegador. */
  readonly sales = signal<Sale[]>([]);

  /** Historial de compras del servicio (una fila por item de compra). */
  readonly purchases = signal<Purchase[]>([]);
  readonly cargandoCompras = signal<boolean>(false);
  readonly errorCompras = signal<string>('');

  readonly summary = signal<ReportSummary>(EMPTY_SUMMARY);
  readonly salesByDate = signal<SalesByDateItem[]>([]);
  readonly topMedicines = signal<TopMedicineItem[]>([]);
  readonly cargando = signal<boolean>(false);
  readonly errorCarga = signal<boolean>(false);

  readonly balance = computed(() => this.summary().sales.total - this.summary().purchases.total);

  /** Valor absoluto del balance: el signo se dibuja aparte para no escribir "$-". */
  readonly balanceAbsoluto = computed(() => Math.abs(this.balance()));

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

  // ===== Compras: misma mecánica, alimentada por PurchaseService.purchases$ =====

  /**
   * Base de los KPIs y de las gráficas de compras: todo el historial en la vista
   * general y solo el filtro aplicado cuando hay uno activo.
   */
  readonly comprasBase = computed<Purchase[]>(() =>
    this.reporteGenerado() ? this.filteredCompras() : this.purchases()
  );

  readonly chartCompras = computed<SalesByDateItem[]>(() =>
    this.agruparPorDia(this.comprasBase())
  );

  readonly maxCompraDiaria = computed(() => {
    const items = this.chartCompras();
    if (!items.length) return 1;
    return Math.max(...items.map((i) => i.total), 1);
  });

  readonly topCompras = computed<TopMedicineItem[]>(() =>
    this.agregarTopPorCantidad(this.comprasBase())
  );

  readonly totalInvertido = computed(() =>
    this.comprasBase().reduce((suma, compra) => suma + (Number(compra.total) || 0), 0)
  );

  readonly lineasCompra = computed(() => this.comprasBase().length);

  readonly proveedoresDistintos = computed(
    () => new Set(this.comprasBase().map((compra) => compra.provider)).size
  );

  readonly medicamentoMasComprado = computed<{ nombre: string; cantidad: number } | null>(() => {
    const top = this.topCompras()[0];
    return top ? { nombre: top.name ?? top.medicineId, cantidad: top.quantity } : null;
  });

  readonly filasGeneralesCompras = computed<CompraRow[]>(() =>
    this.ultimosMovimientos(this.purchases()).map((compra) => this.filaDeCompra(compra))
  );

  readonly filasCompras = computed<CompraRow[]>(() =>
    this.reporteGenerado()
      ? this.ordenarPorFechaDesc(this.filteredCompras()).map((compra) => this.filaDeCompra(compra))
      : this.filasGeneralesCompras()
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

  readonly tituloTablaCompras = computed(() =>
    this.reporteGenerado() ? 'Detalle de Compras Filtradas' : 'Compras Recientes'
  );

  readonly notaTablaCompras = computed(() => {
    const cantidad = this.filasCompras().length;
    return this.reporteGenerado()
      ? `${cantidad} compra(s) para el filtro aplicado.`
      : `Resumen de las últimas ${RECIENTES_MAX} compras registradas.`;
  });

  readonly mensajeVacioCompras = computed(() =>
    this.reporteGenerado()
      ? 'No hay compras registradas para este filtro.'
      : 'Todavía no hay compras registradas.'
  );

  /** Nombre de la hoja y del archivo exportado según el modo activo. */
  readonly nombreHoja = computed(() =>
    this.modo() === 'compras' ? 'Informe de Compras' : 'Informe de Ventas'
  );

  /** Base completa de ventas: todo el historial, o solo el filtro cuando hay uno. */
  private readonly ventasBase = computed<Sale[]>(() =>
    this.reporteGenerado() ? this.filteredSales() : this.sales()
  );

  /** Filas completas de ventas para exportar (sin el tope de la tabla visible). */
  private readonly filasExportacionVentas = computed<MovimientoRow[]>(() =>
    this.ordenarPorFechaDesc(this.ventasBase()).map((venta) => this.filaDeVenta(venta))
  );

  /** Filas completas de compras para exportar (sin el tope de la tabla visible). */
  private readonly filasExportacionCompras = computed<CompraRow[]>(() =>
    this.ordenarPorFechaDesc(this.comprasBase()).map((compra) => this.filaDeCompra(compra))
  );

  /**
   * Filas que se exportan: siempre el conjunto COMPLETO del modo activo (el filtro
   * cuando hay filtro, todo el historial cuando no lo hay). La tabla visible se
   * acota a los últimos movimientos, pero un informe exportado no debe perder filas.
   */
  readonly filasExportables = computed<FilaExportable[]>(() =>
    this.modo() === 'compras'
      ? this.filasExportacionCompras().map((fila) => ({
          Fecha: this.formatFecha(fila.dia),
          Proveedor: fila.proveedor,
          Medicamento: fila.medicamento,
          Cantidad: fila.cantidad,
          'Precio Unitario': fila.precioUnitario,
          Total: fila.total
        }))
      : this.filasExportacionVentas().map((fila) => ({
          'Fecha de Venta': this.formatFecha(fila.dia),
          Medicamento: fila.medicamento,
          'Cantidad Vendida': fila.cantidad,
          'Total de Venta': fila.total
        }))
  );

  searchText = '';
  fechaDesde = '';
  fechaHasta = '';

  private pendientes = 0;
  private timeoutRef: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.medicineService.medicines$.subscribe((data) => this.medicines.set(data));
    this.salesService.sales$.subscribe((data) => this.sales.set(data));
    this.purchaseService.purchases$.subscribe((data) => this.purchases.set(data ?? []));
    this.purchaseService.cargando$.subscribe((valor) => this.cargandoCompras.set(!!valor));
    this.purchaseService.errorCarga$.subscribe((texto) => this.errorCompras.set(texto ?? ''));

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

  /** Reintenta la carga de compras desde el servicio. */
  recargarCompras(): void {
    this.purchaseService.loadPurchases();
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

  getBarWidth(total: number, maximo: number = this.maxDailySale()): number {
    return Math.max(8, Math.round((total / maximo) * 100));
  }

  /** Cambia el modo y deja los filtros limpios para no arrastrar datos del otro informe. */
  cambiarModo(modo: ModoInforme): void {
    if (this.modo() === modo) return;
    this.limpiarFiltros();
    this.modo.set(modo);
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

  /** Exporta las filas del modo activo (filtradas o generales) a un .xlsx. */
  exportarExcel(): void {
    const filas = this.filasExportables();

    if (filas.length === 0) {
      this.mostrarAlerta('No hay datos para exportar', true);
      return;
    }

    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, this.nombreHoja());
    XLSX.writeFile(libro, `${this.nombreHoja()}.xlsx`);
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

  // ===== Helpers puros de agregación (ventas y compras) =====

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
   * Medicamentos con más unidades en el conjunto de movimientos dado, de mayor a
   * menor. Reutiliza el mismo shape que el top del backend.
   */
  agregarTopPorCantidad(movimientos: MovimientoFiltrable[], maximo: number = TOP_MAX): TopMedicineItem[] {
    const acumulado = new Map<string, { quantity: number; total: number }>();

    (movimientos ?? []).forEach((movimiento) => {
      const actual = acumulado.get(movimiento.medicineId) ?? { quantity: 0, total: 0 };
      actual.quantity += Number(movimiento.quantity) || 0;
      actual.total += Number(movimiento.total) || 0;
      acumulado.set(movimiento.medicineId, actual);
    });

    return Array.from(acumulado.entries())
      .map(([medicineId, valor]) => {
        const med = this.medicines().find((m) => m.id === medicineId);
        return {
          medicineId,
          name: med?.name ?? null,
          laboratory: med?.laboratory ?? null,
          quantity: valor.quantity,
          total: valor.total
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, maximo);
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

  /** Convierte una línea de compra del historial en una fila mostrable de la tabla. */
  filaDeCompra(compra: Purchase): CompraRow {
    return {
      id: compra.id,
      dia: this.diaISO(compra.date),
      proveedor: compra.provider,
      medicamento: this.getMedicineName(compra.medicineId),
      cantidad: Number(compra.quantity) || 0,
      precioUnitario: Number(compra.purchasePrice) || 0,
      total: Number(compra.total) || 0
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

    // El modo activo define qué historial se filtra.
    if (this.modo() === 'compras') {
      const resultados = this.filtrarMovimientos(this.purchases(), {
        medicineId: med?.id,
        desde,
        hasta
      });

      this.filteredCompras.set(resultados);
      this.reporteGenerado.set(true);
      this.avisarResultado(resultados.length);
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
      this.avisarResultado(resultados.length);
    });
  }

  private avisarResultado(cantidad: number): void {
    if (cantidad === 0) {
      this.mostrarAlerta('No se encontraron datos', true);
    } else {
      this.mostrarAlerta('Reporte generado');
    }
  }

  limpiarFiltros(): void {
    this.searchText = '';
    this.selectedMedicine.set(undefined);
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.filteredSales.set([]);
    this.filteredCompras.set([]);
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

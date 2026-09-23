import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { take } from 'rxjs/operators';
import { SalesService } from '../../services/sales.service';
import { MedicineService } from '../../services/medicine.service';
import { Sale } from '../../models/sale';
import { Medicine } from '../../models/medicine';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reports',
  standalone: true,
  // MIGRACIÓN ANGULAR 21: Se remueve CommonModule y se agregan DatePipe y DecimalPipe
  imports: [RouterModule, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css'],
  encapsulation: ViewEncapsulation.None
})
export class Reports {
  // MIGRACIÓN ANGULAR 21: Inyección mediante inject()
  private readonly salesService = inject(SalesService);
  private readonly medicineService = inject(MedicineService);

  // MIGRACIÓN ANGULAR 21: Gestión de estado reactivo mediante Signals
  readonly mensaje = signal<string>('');
  readonly error = signal<boolean>(false);
  readonly medicines = signal<Medicine[]>([]);
  readonly filteredMedicines = signal<Medicine[]>([]);
  readonly selectedMedicine = signal<Medicine | undefined>(undefined);
  readonly filteredSales = signal<Sale[]>([]);
  readonly reporteGenerado = signal<boolean>(false);

  searchText: string = '';
  fechaDesde: string = '';
  fechaHasta: string = '';

  private timeoutRef: any;

  constructor() {
    this.medicineService.medicines$.subscribe(data => this.medicines.set(data));
  }

  mostrarAlerta(msg: string, esError: boolean = false): void {
    this.mensaje.set(msg);
    this.error.set(esError);

    clearTimeout(this.timeoutRef);

    this.timeoutRef = setTimeout(() => {
      this.mensaje.set('');
    }, 2000);
  }

  cerrarAlerta(): void {
    this.mensaje.set('');
  }

  exportarExcel(): void {
    if (this.filteredSales().length === 0) {
      this.mostrarAlerta('No hay datos en la tabla para exportar', true);
      return;
    }

    const datosExcel = this.filteredSales().map(s => ({
      'Fecha de Venta': new Date(s.date).toLocaleDateString(),
      'Medicamento': this.getMedicineName(s.medicineId),
      'Cantidad Vendida': s.quantity,
      'Total de Venta': s.total
    }));

    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Reporte de Ventas');

    XLSX.writeFile(libro, 'Reporte_Ventas_Drogueria.xlsx');

    this.mostrarAlerta('Archivo Excel generado con éxito');
  }

  onSearch(): void {
    this.selectedMedicine.set(undefined);

    if (this.searchText.length > 1) {
      const filtrados = this.medicines().filter(m =>
        m.name.toLowerCase().includes(this.searchText.toLowerCase())
      );
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

  getMedicineName(id: any): string {
    const med = this.medicines().find(m => m.id === id);
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

    this.salesService.sales$.pipe(take(1)).subscribe(allSales => {
      const resultados = allSales.filter(s => {
        const coincideMed = s.medicineId === idSeleccionado;
        const fechaVenta = new Date(s.date);

        const coincideFecha =
          (!desde || fechaVenta >= desde) &&
          (!hasta || fechaVenta <= hasta);

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
}
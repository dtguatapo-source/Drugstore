import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { SalesService } from '../../services/sales.service';
import { MedicineService } from '../../services/medicine.service';
import { Sale } from '../../models/sale';
import { Medicine } from '../../models/medicine';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css'],
  encapsulation: ViewEncapsulation.None
})
export class Reports implements OnInit {

  mensaje: string = '';
  error: boolean = false;

  private timeoutRef: any;

  medicines: Medicine[] = [];
  filteredMedicines: Medicine[] = [];
  selectedMedicine?: Medicine;
  searchText: string = '';

  fechaDesde: string = '';
  fechaHasta: string = '';

  filteredSales: Sale[] = [];
  reporteGenerado: boolean = false;

  constructor(
    private salesService: SalesService,
    private medicineService: MedicineService
  ) { }

  ngOnInit() {
    this.medicineService.medicines$.subscribe(data => this.medicines = data);
  }

  mostrarAlerta(msg: string, esError: boolean = false) {
    this.mensaje = msg;
    this.error = esError;

    clearTimeout(this.timeoutRef);

    this.timeoutRef = setTimeout(() => {
      this.mensaje = '';
    }, 2000);
  }

  cerrarAlerta() {
    this.mensaje = '';
  }

  exportarExcel() {
    if (this.filteredSales.length === 0) {
      this.mostrarAlerta('No hay datos en la tabla para exportar', true);
      return;
    }

    const datosExcel = this.filteredSales.map(s => ({
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

  onSearch() {
    this.selectedMedicine = undefined;

    if (this.searchText.length > 1) {
      this.filteredMedicines = this.medicines.filter(m =>
        m.name.toLowerCase().includes(this.searchText.toLowerCase())
      );
    } else {
      this.filteredMedicines = [];
    }
  }

  selectMed(med: Medicine) {
    this.selectedMedicine = med;
    this.searchText = med.name;
    this.filteredMedicines = [];
  }

  getMedicineName(id: any): string {
    const med = this.medicines.find(m => m.id === id);
    return med ? med.name : 'Producto';
  }

  generarReporte() {
    if (!this.selectedMedicine) {
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
    const idSeleccionado = this.selectedMedicine.id;

    this.salesService.sales$.pipe(take(1)).subscribe(allSales => {

      this.filteredSales = allSales.filter(s => {
        const coincideMed = s.medicineId === idSeleccionado;
        const fechaVenta = new Date(s.date);

        const coincideFecha =
          (!desde || fechaVenta >= desde) &&
          (!hasta || fechaVenta <= hasta);

        return coincideMed && coincideFecha;
      });

      this.reporteGenerado = true;

      if (this.filteredSales.length === 0) {
        this.mostrarAlerta('No se encontraron datos', true);
      } else {
        this.mostrarAlerta('Reporte generado');
      }

    });
  }

  limpiarFiltros() {
    this.searchText = '';
    this.selectedMedicine = undefined;
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.filteredSales = [];
    this.reporteGenerado = false;
    this.filteredMedicines = [];
  }
}
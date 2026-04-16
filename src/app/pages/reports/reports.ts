import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';

// Importamos solo lo de ventas y medicinas
import { SalesService } from '../../services/sales.service';
import { MedicineService } from '../../services/medicine.service';
import { Sale } from '../../models/sale';
import { Medicine } from '../../models/medicine';

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

  // Buscador 
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

  // Para mostrar el nombre en la tabla usando el ID
  getMedicineName(id: any): string {
    const med = this.medicines.find(m => m.id === id);
    return med ? med.name : 'Producto';
  }


  generarReporte() {

    if (!this.selectedMedicine) {
      this.mensaje = 'Debes seleccionar un medicamento';
      this.error = true;
      return;
    }

    // validar fechas incompletas
    if ((this.fechaDesde && !this.fechaHasta) || (!this.fechaDesde && this.fechaHasta)) {
      this.mensaje = 'Debes seleccionar ambas fechas';
      this.error = true;
      return;
    }

    // validar rango de fechas
    if (this.fechaDesde && this.fechaHasta) {
      const desde = new Date(this.fechaDesde);
      const hasta = new Date(this.fechaHasta);

      if (desde > hasta) {
        this.mensaje = 'La fecha "Desde" no puede ser mayor que "Hasta"';
        this.error = true;
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

      this.mensaje = 'Reporte generado';
      this.error = false;
    });
  }

  // Resetear todo
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
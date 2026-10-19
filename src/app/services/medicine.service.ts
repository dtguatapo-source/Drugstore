import { Injectable, inject } from '@angular/core'; //  Agregamos inject para usar HttpClient en Angular 21
import { HttpClient } from '@angular/common/http'; //  Importamos HttpClient para conectar con el Backend
import { BehaviorSubject } from 'rxjs';
import { Medicine } from '../models/medicine';

@Injectable({ providedIn: 'root' })
export class MedicineService {
  private http = inject(HttpClient); //  Inyectamos HttpClient
  private apiUrl = 'http://localhost:3000/medicines'; //  Endpoint de medicamentos en NestJS

  //  Empezamos desde cero con un arreglo vacío []; todo vendrá de PostgreSQL
  private medicines = new BehaviorSubject<Medicine[]>([]);
  medicines$ = this.medicines.asObservable();

  constructor() {
    this.loadMedicines(); // Al iniciar el servicio, consulta los medicamentos guardados en la BD
  }

  // Obtiene los medicamentos reales desde PostgreSQL (GET http://localhost:3000/medicines)
  loadMedicines() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        const adaptados = (data || []).map((m) => this.adaptarDesdeBackend(m));
        this.medicines.next(adaptados); // 👈 Si la BD está vacía, queda en [] listo para que registres desde cero
      },
      error: (err) => {
        console.error('Error al cargar medicamentos desde el backend:', err);
      }
    });
  }

  addMedicine(medicine: Medicine) {
    const payload = this.prepararParaBackend(medicine); // Preparamos el DTO que exige NestJS

    this.http.post<any>(this.apiUrl, payload).subscribe({
      next: (creado) => {
        const adaptado = this.adaptarDesdeBackend(creado);
        const current = this.medicines.value;
        this.medicines.next([...current, adaptado]); // Se agrega a la tabla y a los selects de Compras/Ventas
      },
      error: (err) => {
        console.error('Error al registrar medicamento:', err);
        alert(err?.error?.message || 'Error al registrar el medicamento en la base de datos');
      }
    });
  }

  //  Elimina un medicamento de PostgreSQL (DELETE http://localhost:3000/medicines/:id)
  deleteMedicine(id: string) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        const current = this.medicines.value;
        const updated = current.filter((m) => m.id !== id);
        this.medicines.next(updated); //  Se quita de la tabla tras eliminarse en la BD
      },
      error: (err) => {
        console.error('Error al eliminar medicamento:', err);
        alert(
          err?.error?.message ||
            'No se pudo eliminar el medicamento (verifica que no tenga compras o ventas asociadas).'
        );
      }
    });
  }

  //  Modifica un medicamento en PostgreSQL (PATCH http://localhost:3000/medicines/:id)
  updateMedicine(updatedMedicine: Medicine) {
    const payload = this.prepararParaBackend(updatedMedicine);
    const { id, ...bodySinId } = payload; // Quitamos id del body porque va en la URL

    this.http.patch<any>(`${this.apiUrl}/${updatedMedicine.id}`, bodySinId).subscribe({
      next: (actualizado) => {
        const adaptado = this.adaptarDesdeBackend(actualizado);
        const current = [...this.medicines.value];
        const index = current.findIndex((m) => m.id === updatedMedicine.id);
        if (index !== -1) {
          current[index] = adaptado;
          this.medicines.next(current); //  Actualiza la fila en la tabla inmediatamente
        }
      },
      error: (err) => {
        console.error('Error al actualizar medicamento:', err);
        alert(err?.error?.message || 'Error al actualizar el medicamento en la base de datos');
      }
    });
  }

  // Calcula el estado visual para tu tabla en el Frontend
  private calcularEstado(stock: number): 'Activo' | 'Bajo stock' | 'Sin stock' {
    if (stock <= 0) return 'Sin stock';
    if (stock < 20) return 'Bajo stock';
    return 'Activo';
  }

  // Traduce el stock al enum EstadoMedicamento ('DISPONIBLE' | 'AGOTADO' | 'VENCIDO') que pide Prisma
  private calcularEstadoBackend(stock: number): 'DISPONIBLE' | 'AGOTADO' | 'VENCIDO' {
    return stock > 0 ? 'DISPONIBLE' : 'AGOTADO';
  }

  // Arma el objeto con los tipos exactos que valida CreateMedicineDto en NestJS
  private prepararParaBackend(medicine: Medicine) {
    const stockNum = Number(medicine.stock) || 0;
    const keywordsStr = Array.isArray(medicine.keywords)
      ? medicine.keywords.join(', ')
      : medicine.keywords || '';

    return {
      id: medicine.id.trim(),
      name: medicine.name.trim(),
      laboratory: medicine.laboratory.trim(),
      category: medicine.category || 'General',
      description: medicine.description?.trim() || 'Sin descripción',
      keywords: keywordsStr,
      stock: stockNum,
      purchasePrice: Number(medicine.purchasePrice) || 0,
      salePrice: Number(medicine.salePrice) || 0,
      status: this.calcularEstadoBackend(stockNum)
    };
  }

  //  Convierte los datos que llegan de Prisma (Decimal/String) al formato de tu interfaz Medicine
  private adaptarDesdeBackend(m: any): Medicine {
    const stockNum = Number(m.stock) || 0;
    const keywordsArr =
      typeof m.keywords === 'string'
        ? m.keywords
            .split(',')
            .map((k: string) => k.trim())
            .filter(Boolean)
        : Array.isArray(m.keywords)
        ? m.keywords
        : [];

    return {
      id: m.id,
      name: m.name,
      laboratory: m.laboratory,
      category: m.category || '',
      description: m.description || '',
      keywords: keywordsArr,
      stock: stockNum,
      purchasePrice: Number(m.purchasePrice) || 0,
      salePrice: Number(m.salePrice) || 0,
      status: this.calcularEstado(stockNum)
    };
  }

  // Devuelve el valor actual del inventario
  getMedicinesValue(): Medicine[] {
    return this.medicines.value;
  }
}
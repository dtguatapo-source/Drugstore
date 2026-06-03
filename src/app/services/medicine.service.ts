import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Medicine } from '../models/medicine';

@Injectable({ providedIn: 'root' })
export class MedicineService {
  //lista 
  private initialMedicines: Medicine[] = [
{id: 'MED-001',name: 'Ibuprofeno 400mg',laboratory: 'Genfar',category: 'Dolor e inflamacion',description: 'antiinflamatorio para dolor muscular fiebre migraña colicos artritis dolor cabeza',
  keywords: [
    'dolor',
    'inflamacion',
    'fiebre',
    'migraña',
    'dolor muscular',
    'colicos',
    'artritis',
    'dolor cabeza'
  ],stock: 120,purchasePrice: 2500,salePrice: 3800,status: 'Activo'
},
{id: 'MED-002',name: 'Acetaminofén 500mg',laboratory: 'Bayer',category: 'Dolor y fiebre',description: 'analgesico y antipiretico para dolor leve fiebre gripa malestar general migraña temperatura',
  keywords: [
    'dolor',
    'fiebre',
    'gripa',
    'migraña',
    'temperatura',
    'dolor cabeza',
    'malestar'
  ], stock: 15,purchasePrice: 1200,salePrice: 1900,status: 'Bajo stock'
},   
{
  id: 'MED-003',
  name: 'Loratadina 10mg (Tableta)',
  laboratory: 'Tecnoquímicas',

  category: 'Alergias',

  description: 'antihistaminico para alergias estornudos picazon congestion nasal moqueadera ojos llorosos rinitis alergica',

  keywords: [
    'alergia',
    'estornudos',
    'picazon',
    'rinitis',
    'congestion',
    'moqueadera',
    'ojos llorosos'
  ],

  stock: 300,
  purchasePrice: 4800,
  salePrice: 7200,
  status: 'Activo'
},

{
  id: 'MED-004',
  name: 'Amoxicilina + Ácido Clavulánico (Jarabe)',
  laboratory: 'GlaxoSmithKline',

  category: 'Antibioticos',

  description: 'antibiotico para infecciones garganta oido bacterias infeccion respiratoria',

  keywords: [
    'infeccion',
    'garganta',
    'oido',
    'bacterias',
    'antibiotico',
    'respiratoria'
  ],

  stock: 80,
  purchasePrice: 152000,
  salePrice: 7200,
  status: 'Activo'
},

{
  id: 'MED-005',
  name: 'Diclofenaco Gel 1%',
  laboratory: 'Novartis',

  category: 'Dolor muscular',

  description: 'gel antiinflamatorio para dolor muscular golpes inflamacion articular espalda',

  keywords: [
    'dolor muscular',
    'golpes',
    'inflamacion',
    'articulaciones',
    'espalda',
    'musculos'
  ],

  stock: 12,
  purchasePrice: 8500,
  salePrice: 1400,
  status: 'Activo'
},

{
  id: 'MED-006',
  name: 'Omeprazol 20mg (Cápsula)',
  laboratory: 'La Santé',

  category: 'Gastritis',

  description: 'protector gastrico para gastritis reflujo acidez ardor estomacal',

  keywords: [
    'gastritis',
    'reflujo',
    'acidez',
    'ardor',
    'estomago',
    'agruras'
  ],

  stock: 100,
  purchasePrice: 4800,
  salePrice: 6200,
  status: 'Activo'
},

{
  id: 'MED-007',
  name: 'Melatonina 5mg',
  laboratory: 'Natures Bounty',

  category: 'Sueño y relajacion',

  description: 'suplemento natural para dormir relajacion estres ansiedad leve insomnio',

  keywords: [
    'dormir',
    'insomnio',
    'estres',
    'ansiedad',
    'relajacion',
    'sueño'
  ],

  stock: 40,
  purchasePrice: 9000,
  salePrice: 15000,
  status: 'Activo'
},

{
  id: 'MED-008',
  name: 'Ambroxol Jarabe',
  laboratory: 'MK',

  category: 'Tos y gripa',

  description: 'jarabe expectorante para tos flema congestion gripe bronquios',

  keywords: [
    'tos',
    'flema',
    'gripa',
    'bronquios',
    'jarabe',
    'congestion'
  ],

  stock: 40,
  purchasePrice: 6000,
  salePrice: 8500,
  status: 'Activo'
},

{
  id: 'MED-009',
  name: 'Loperamida 2mg',
  laboratory: 'Genfar',

  category: 'Diarrea',

  description: 'medicamento para diarrea malestar intestinal evacuaciones frecuentes',

  keywords: [
    'diarrea',
    'intestinal',
    'evacuaciones',
    'estomago',
    'malestar intestinal'
  ],

  stock: 60,
  purchasePrice: 2000,
  salePrice: 3500,
  status: 'Activo'
},

{
  id: 'MED-010',
  name: 'Dramamine',
  laboratory: 'Pfizer',

  category: 'Nauseas',

  description: 'medicamento para nausea vomito mareo viajes vertigo',

  keywords: [
    'nauseas',
    'vomito',
    'mareo',
    'viajes',
    'vertigo'
  ],

  stock: 35,
  purchasePrice: 3500,
  salePrice: 5500,
  status: 'Activo'
},

{
  id: 'MED-011',
  name: 'Cetirizina 10mg',
  laboratory: 'MK',

  category: 'Alergias',

  description: 'antihistaminico para alergias picazon congestion estornudos',

  keywords: [
    'alergia',
    'picazon',
    'congestion',
    'estornudos',
    'rinitis'
  ],

  stock: 90,
  purchasePrice: 2500,
  salePrice: 4500,
  status: 'Activo'
},

{
  id: 'MED-012',
  name: 'Azitromicina 500mg',
  laboratory: 'Genfar',

  category: 'Antibioticos',

  description: 'antibiotico para infecciones respiratorias garganta pulmones',

  keywords: [
    'infeccion',
    'garganta',
    'pulmones',
    'respiratoria',
    'antibiotico'
  ],

  stock: 55,
  purchasePrice: 8000,
  salePrice: 12000,
  status: 'Activo'
},

{
  id: 'MED-013',
  name: 'Salbutamol Inhalador',
  laboratory: 'GlaxoSmithKline',

  category: 'Respiratorio',

  description: 'inhalador para asma dificultad respiratoria falta de aire',

  keywords: [
    'asma',
    'respirar',
    'aire',
    'bronquios',
    'respiracion'
  ],

  stock: 25,
  purchasePrice: 15000,
  salePrice: 22000,
  status: 'Activo'
},

{
  id: 'MED-014',
  name: 'Dolex Gripa',
  laboratory: 'GSK',

  category: 'Gripa',

  description: 'medicamento para gripa fiebre congestion malestar general',

  keywords: [
    'gripa',
    'fiebre',
    'congestion',
    'malestar',
    'resfriado'
  ],

  stock: 45,
  purchasePrice: 4000,
  salePrice: 6500,
  status: 'Activo'
},

{
  id: 'MED-015',
  name: 'Buscapina',
  laboratory: 'Sanofi',

  category: 'Dolor estomacal',

  description: 'medicamento para colicos dolor abdominal espasmos',

  keywords: [
    'colicos',
    'abdominal',
    'dolor estomago',
    'espasmos'
  ],

  stock: 50,
  purchasePrice: 5000,
  salePrice: 7500,
  status: 'Activo'
},
{
  id: 'MED-016',
  name: 'Vitamina C 500mg',
  laboratory: 'MK',

  category: 'Vitaminas',

  description: 'vitamina para defensas cansancio gripe energia sistema inmune',

  keywords: [
    'vitamina',
    'defensas',
    'gripa',
    'energia',
    'cansancio',
    'inmune'
  ],

  stock: 120,
  purchasePrice: 3000,
  salePrice: 5000,
  status: 'Activo'
},

{
  id: 'MED-017',
  name: 'Caladryl Loción',
  laboratory: 'Johnson & Johnson',

  category: 'Picazon y piel',

  description: 'locion para picazon alergias piel irritacion ronchas',

  keywords: [
    'picazon',
    'piel',
    'alergia',
    'ronchas',
    'irritacion'
  ],

  stock: 30,
  purchasePrice: 7000,
  salePrice: 11000,
  status: 'Activo'
},

{
  id: 'MED-018',
  name: 'Naproxeno 500mg',
  laboratory: 'Genfar',

  category: 'Dolor e inflamacion',

  description: 'antiinflamatorio para dolor fuerte inflamacion muscular artritis',

  keywords: [
    'dolor',
    'inflamacion',
    'muscular',
    'artritis',
    'dolor fuerte'
  ],

  stock: 70,
  purchasePrice: 4500,
  salePrice: 7000,
  status: 'Activo'
},

{
  id: 'MED-019',
  name: 'Melatonina',
  laboratory: 'Natures Bounty',

  category: 'Sueño',

  description: 'ayuda natural para dormir insomnio descanso ansiedad',

  keywords: [
    'dormir',
    'insomnio',
    'descanso',
    'ansiedad',
    'sueño'
  ],

  stock: 40,
  purchasePrice: 9000,
  salePrice: 14000,
  status: 'Activo'
},

{
  id: 'MED-020',
  name: 'Pepto Bismol',
  laboratory: 'Pfizer',

  category: 'Malestar estomacal',

  description: 'alivia nausea diarrea indigestion dolor estomacal acidez',

  keywords: [
    'nauseas',
    'diarrea',
    'indigestion',
    'acidez',
    'estomago'
  ],

  stock: 28,
  purchasePrice: 10000,
  salePrice: 15000,
  status: 'Activo'
},

{
  id: 'MED-021',
  name: 'Suero Oral',

  laboratory: 'Pedialyte',

  category: 'Deshidratacion',

  description: 'hidratacion para diarrea vomito fiebre debilidad',

  keywords: [
    'deshidratacion',
    'diarrea',
    'vomito',
    'fiebre',
    'debilidad'
  ],

  stock: 100,
  purchasePrice: 2500,
  salePrice: 4500,
  status: 'Activo'
},

{
  id: 'MED-022',
  name: 'Clotrimazol Crema',
  laboratory: 'MK',

  category: 'Hongos',

  description: 'crema antimicotica para hongos piel picazon infeccion',

  keywords: [
    'hongos',
    'piel',
    'picazon',
    'infeccion',
    'comezon'
  ],

  stock: 33,
  purchasePrice: 5000,
  salePrice: 8500,
  status: 'Activo'
},

{
  id: 'MED-023',
  name: 'Albendazol',
  laboratory: 'Genfar',

  category: 'Parasitos',

  description: 'medicamento antiparasitario para lombrices dolor abdominal',

  keywords: [
    'parasitos',
    'lombrices',
    'abdominal',
    'estomago',
    'gusanos'
  ],

  stock: 48,
  purchasePrice: 3500,
  salePrice: 6000,
  status: 'Activo'
},

{
  id: 'MED-024',
  name: 'Metoclopramida',
  laboratory: 'MK',

  category: 'Nauseas',

  description: 'medicamento para vomito nausea mareo malestar estomacal',

  keywords: [
    'vomito',
    'nauseas',
    'mareo',
    'estomago',
    'malestar'
  ],

  stock: 22,
  purchasePrice: 3000,
  salePrice: 5500,
  status: 'Activo'
},

{
  id: 'MED-025',
  name: 'Aspirina 100mg',
  laboratory: 'Bayer',

  category: 'Dolor y circulacion',

  description: 'analgesico para dolor fiebre circulacion dolor cabeza',

  keywords: [
    'dolor',
    'fiebre',
    'cabeza',
    'circulacion',
    'migraña'
  ],

  stock: 85,
  purchasePrice: 2500,
  salePrice: 4200,
  status: 'Activo'
},

{
  id: 'MED-026',
  name: 'Losartan 50mg',
  laboratory: 'MK',

  category: 'Presion arterial',

  description: 'medicamento para hipertension presion arterial alta',

  keywords: [
    'presion',
    'hipertension',
    'arterial',
    'alta',
    'corazon'
  ],

  stock: 65,
  purchasePrice: 8000,
  salePrice: 12000,
  status: 'Activo'
},

{
  id: 'MED-027',
  name: 'Metformina 850mg',
  laboratory: 'Genfar',

  category: 'Diabetes',

  description: 'medicamento para controlar azucar diabetes glucosa',

  keywords: [
    'diabetes',
    'azucar',
    'glucosa',
    'sangre'
  ],

  stock: 77,
  purchasePrice: 6500,
  salePrice: 9800,
  status: 'Activo'
},

{
  id: 'MED-028',
  name: 'Diclofenaco Tabletas',
  laboratory: 'MK',

  category: 'Dolor e inflamacion',

  description: 'antiinflamatorio para dolor muscular espalda articulaciones golpes',

  keywords: [
    'dolor',
    'inflamacion',
    'espalda',
    'golpes',
    'articulaciones'
  ],

  stock: 58,
  purchasePrice: 4000,
  salePrice: 7000,
  status: 'Activo'
},

{
  id: 'MED-029',
  name: 'Jarabe para la Tos Infantil',
  laboratory: 'Genfar',

  category: 'Tos infantil',

  description: 'jarabe infantil para tos congestion flema garganta',

  keywords: [
    'tos',
    'niños',
    'flema',
    'garganta',
    'congestion'
  ],

  stock: 44,
  purchasePrice: 6500,
  salePrice: 9800,
  status: 'Activo'
},

{
  id: 'MED-030',
  name: 'Paracetamol Infantil',
  laboratory: 'MK',

  category: 'Fiebre infantil',

  description: 'medicamento infantil para fiebre dolor gripa temperatura',

  keywords: [
    'fiebre',
    'niños',
    'gripa',
    'dolor',
    'temperatura'
  ],

  stock: 52,
  purchasePrice: 5000,
  salePrice: 8200,
  status: 'Activo'
},
{
  id: 'MED-031',
  name: 'Vitamina B12',
  laboratory: 'MK',

  category: 'Energia y cansancio',

  description: 'vitamina para cansancio debilidad energia estres agotamiento',

  keywords: [
    'cansancio',
    'estres',
    'agotamiento',
    'energia',
    'debilidad'
  ],

  stock: 55,
  purchasePrice: 7000,
  salePrice: 12000,
  status: 'Activo'
},

{
  id: 'MED-032',
  name: 'Té Relax Natural',
  laboratory: 'Hindú',

  category: 'Relajacion',

  description: 'infusion natural para relajacion nervios estres ansiedad leve',

  keywords: [
    'relajacion',
    'estres',
    'ansiedad',
    'nervios',
    'calma'
  ],

  stock: 25,
  purchasePrice: 4000,
  salePrice: 7000,
  status: 'Activo'
}

  ];

  private medicines = new BehaviorSubject<Medicine[]>(this.initialMedicines); 
  medicines$ = this.medicines.asObservable();

  
  //  agrego
  addMedicine(medicine: Medicine) {
    const current = this.medicines.value;
    
    // calcula el estado antes de guardar 
    medicine.status = this.calcularEstado(medicine.stock);
    
    this.medicines.next([...current, medicine]);
  }

  // elimino
  deleteMedicine(id: string) {
    const current = this.medicines.value;
    const updated = current.filter(m => m.id !== id);
    this.medicines.next(updated);
  }

  // se modifica pero se debe seleccionar 
  updateMedicine(updatedMedicine: Medicine) {
    const current = this.medicines.value;
    updatedMedicine.status = this.calcularEstado(updatedMedicine.stock);
    
    const index = current.findIndex(m => m.id === updatedMedicine.id);
    if (index !== -1) {
      current[index] = updatedMedicine;
      this.medicines.next([...current]);
    }
  }

//calculamos el stocjj

  private calcularEstado(stock: number): 'Activo' | 'Bajo stock' | 'Sin stock' {
    if (stock === 0) return 'Sin stock';
    if (stock < 20) return 'Bajo stock';
    return 'Activo';
  }

        // esto de medicine.service.ts
      getMedicinesValue(): Medicine[] {
        return this.medicines.value;
      }
}

//este servicio central del inventario 

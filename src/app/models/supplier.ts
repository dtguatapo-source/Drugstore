export interface Supplier {
  id: number;
  nit: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

/** Datos que exige el backend para crear o editar un proveedor */
export type SupplierPayload = Omit<Supplier, 'id'>;

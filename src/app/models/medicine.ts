export interface Medicine {
  id: string;
  name: string;
  laboratory: string;

  category?: string;

  description: string;

  keywords?: string[] | string;

  stock: number;
  purchasePrice: number;
  salePrice: number;

  // 'Vencido' lo decide el backend (allí vive expiryDate); el resto se deriva del stock
  status?: 'Activo' | 'Bajo stock' | 'Sin stock' | 'Vencido';
}
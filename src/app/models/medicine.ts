export interface Medicine {
  id: string;
  name: string;
  laboratory: string;

  category?: string;

  description: string;

  keywords?: string[];

  stock: number;
  purchasePrice: number;
  salePrice: number;

  status?: 'Activo' | 'Bajo stock' | 'Sin stock';
}
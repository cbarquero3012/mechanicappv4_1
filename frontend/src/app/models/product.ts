export interface Product {
  id?: number;
  name: string;
  sku?: string;
  category: string;
  description?: string;
  quantity: number;
  minStock: number;
  unitCost: number;
  sellPrice: number;
  brand?: string;
  currencyId?: number;
  currencySymbol?: string;
  createdAt?: string;
  updatedAt?: string;
}

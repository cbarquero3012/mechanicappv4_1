export interface Part {
  id?: number;
  name: string;
  partNumber?: string;
  category: string;
  quantity: number;
  minStock: number;
  unitCost: number;
  sellPrice: number;
  supplier?: string;
  location?: string;
  currencyId?: number;
  currencySymbol?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RepairOrderProductItem {
  id?: number;
  repairOrderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
  createdAt?: string;
  // Display fields
  productName?: string;
  productSKU?: string;
  productCategory?: string;
  currencySymbol?: string;
}

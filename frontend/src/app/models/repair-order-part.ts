export interface RepairOrderPartItem {
  id?: number;
  repairOrderId: number;
  partId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
  createdAt?: string;
  // Display fields
  partName?: string;
  partNumber?: string;
  partCategory?: string;
  currencySymbol?: string;
}

export interface RepairOrderServiceItem {
  id?: number;
  repairOrderId: number;
  serviceId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
  createdAt?: string;
  // Display fields
  serviceName?: string;
  serviceCategory?: string;
  currencySymbol?: string;
}

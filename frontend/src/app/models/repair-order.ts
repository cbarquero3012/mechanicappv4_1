export interface RepairOrder {
  id?: number;
  detailCarId?: number;
  mechanicId?: number;
  orderDate?: string;
  status: string;
  totalCost: number;
  notes?: string;
  currencyId?: number;
  createdAt?: string;
  // Display fields from JOINs
  carInfo?: string;
  mechanicName?: string;
  currencySymbol?: string;
  totalPaid?: number;
  customerName?: string;
  licensePlate?: string;
}

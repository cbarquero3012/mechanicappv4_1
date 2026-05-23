export interface Payment {
  id?: number;
  repairOrderIds?: number[];
  customerId?: number;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  paymentDate?: string;
  notes?: string;
  currencyId?: number;
  originalAmount?: number;
  originalCurrencyId?: number;
  createdAt?: string;
  // Display fields from JOINs
  orderInfo?: string;
  carInfo?: string;
  customerName?: string;
  orderTotal?: number;
  currencySymbol?: string;
  originalCurrencySymbol?: string;
}

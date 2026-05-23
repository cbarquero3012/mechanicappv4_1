export interface DetailCar {
  id?: number;
  carModelId: number;
  customerId?: number;
  vin: string;
  fuel: string;
  year: number;
  typeCar: string;
  transmissionType: string;
  licensePlate?: string;
  mileage?: number;
  createdAt?: string;
  // Display fields from JOINs
  brand?: string;
  model?: string;
  customerName?: string;
}

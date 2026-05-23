export interface CarModel {
  id?: number;
  brandId: number;
  modelName: string;
  createdAt?: string;
  // Display field from JOIN
  brandName?: string;
}

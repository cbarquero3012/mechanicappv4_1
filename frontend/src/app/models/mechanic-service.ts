export interface MechanicService {
  id?: number;
  name: string;
  category: string;
  description?: string;
  basePrice: number;
  estimatedHours?: number;
  isActive: boolean;
  currencyId?: number;
  currencySymbol?: string;
  createdAt?: string;
  updatedAt?: string;
}

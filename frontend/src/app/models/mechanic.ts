export interface Mechanic {
  id?: number;
  firstName: string;
  lastName: string;
  specialty?: string;
  hireDate?: string;
  isActive: boolean;
  createdAt?: string;
  linkedUserId?: number | null;
  linkedUsername?: string;
}

export interface MechanicUserOption {
  id: number;
  username: string;
  fullName: string;
  mechanicId?: number | null;
}

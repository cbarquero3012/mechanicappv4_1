export interface User {
  id?: number;
  username: string;
  fullName: string;
  email: string;
  role: string; // 'admin' | 'supervisor' | 'mechanic'
  active: boolean;
  mechanicId?: number | null;
  country?: string;
  createdAt?: string;
}

export interface CreateUser {
  username: string;
  password: string;
  fullName?: string;
  email?: string;
  role?: string;
  active?: boolean;
  mechanicId?: number | null;
  country?: string;
}

export interface UpdateUser {
  username?: string;
  password?: string;
  fullName?: string;
  email?: string;
  role?: string;
  active?: boolean;
  mechanicId?: number | null;
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RecentOrder {
  id: number;
  status: string;
  totalCost: number;
  orderDate: string;
  carInfo: string;
  mechanicName: string;
}

export interface DashboardStats {
  customerCount: number;
  vehicleCount: number;
  mechanicCount: number;
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  totalRevenue: number;
  paidRevenue: number;
  recentOrders: RecentOrder[];
  currencySymbol: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>('/api/dashboard/stats');
  }
}

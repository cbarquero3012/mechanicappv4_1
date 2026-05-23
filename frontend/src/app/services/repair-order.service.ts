import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RepairOrder } from '../models/repair-order';
import { RepairOrderServiceItem } from '../models/repair-order-service';
import { RepairOrderPartItem } from '../models/repair-order-part';
import { RepairOrderProductItem } from '../models/repair-order-product';

@Injectable({
  providedIn: 'root',
})
export class RepairOrderService {
  private apiUrl = '/api/repairorder';
  private orderServicesUrl = '/api/repairorderservice';
  private orderPartsUrl = '/api/repairorderpart';
  private orderProductsUrl = '/api/repairorderproduct';

  constructor(private http: HttpClient) {}

  getOrders(): Observable<RepairOrder[]> {
    return this.http.get<RepairOrder[]>(this.apiUrl);
  }

  getOrder(id: number): Observable<RepairOrder> {
    return this.http.get<RepairOrder>(`${this.apiUrl}/${id}`);
  }

  addOrder(order: RepairOrder): Observable<any> {
    return this.http.post(this.apiUrl, order);
  }

  updateOrder(order: RepairOrder): Observable<any> {
    return this.http.put(this.apiUrl, order);
  }

  deleteOrder(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // --- Order-Service linking ---
  getOrderServices(
    repairOrderId: number,
  ): Observable<RepairOrderServiceItem[]> {
    return this.http.get<RepairOrderServiceItem[]>(
      `${this.orderServicesUrl}/${repairOrderId}`,
    );
  }

  addOrderService(item: RepairOrderServiceItem): Observable<any> {
    return this.http.post(this.orderServicesUrl, item);
  }

  deleteOrderService(id: number): Observable<any> {
    return this.http.delete(`${this.orderServicesUrl}/${id}`);
  }

  // --- Order-Part linking ---
  getOrderParts(repairOrderId: number): Observable<RepairOrderPartItem[]> {
    return this.http.get<RepairOrderPartItem[]>(
      `${this.orderPartsUrl}/${repairOrderId}`,
    );
  }

  addOrderPart(item: RepairOrderPartItem): Observable<any> {
    return this.http.post(this.orderPartsUrl, item);
  }

  deleteOrderPart(id: number): Observable<any> {
    return this.http.delete(`${this.orderPartsUrl}/${id}`);
  }

  // --- Order-Product linking ---
  getOrderProducts(
    repairOrderId: number,
  ): Observable<RepairOrderProductItem[]> {
    return this.http.get<RepairOrderProductItem[]>(
      `${this.orderProductsUrl}/${repairOrderId}`,
    );
  }

  addOrderProduct(item: RepairOrderProductItem): Observable<any> {
    return this.http.post(this.orderProductsUrl, item);
  }

  deleteOrderProduct(id: number): Observable<any> {
    return this.http.delete(`${this.orderProductsUrl}/${id}`);
  }
}

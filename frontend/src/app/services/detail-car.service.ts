import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetailCar } from '../models/detail-car';

@Injectable({
  providedIn: 'root',
})
export class DetailCarService {
  private apiUrl = '/api/detailcar';

  constructor(private http: HttpClient) {}

  getDetailCars(): Observable<DetailCar[]> {
    return this.http.get<DetailCar[]>(this.apiUrl);
  }

  getDetailCar(id: number): Observable<DetailCar> {
    return this.http.get<DetailCar>(`${this.apiUrl}/${id}`);
  }

  getByCustomer(customerId: number): Observable<DetailCar[]> {
    return this.http.get<DetailCar[]>(`${this.apiUrl}/customer/${customerId}`);
  }

  addDetailCar(detail: DetailCar): Observable<any> {
    return this.http.post(this.apiUrl, detail);
  }

  updateDetailCar(detail: DetailCar): Observable<any> {
    return this.http.put(this.apiUrl, detail);
  }

  deleteDetailCar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

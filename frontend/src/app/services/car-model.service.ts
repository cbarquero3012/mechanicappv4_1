import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CarModel } from '../models/car-model';

@Injectable({
  providedIn: 'root',
})
export class CarModelService {
  private apiUrl = '/api/carmodel';

  constructor(private http: HttpClient) {}

  getModels(): Observable<CarModel[]> {
    return this.http.get<CarModel[]>(this.apiUrl);
  }

  getModel(id: number): Observable<CarModel> {
    return this.http.get<CarModel>(`${this.apiUrl}/${id}`);
  }

  getModelsByBrand(brandId: number): Observable<CarModel[]> {
    return this.http.get<CarModel[]>(`${this.apiUrl}/brand/${brandId}`);
  }

  addModel(model: CarModel): Observable<any> {
    return this.http.post(this.apiUrl, model);
  }

  updateModel(model: CarModel): Observable<any> {
    return this.http.put(this.apiUrl, model);
  }

  deleteModel(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

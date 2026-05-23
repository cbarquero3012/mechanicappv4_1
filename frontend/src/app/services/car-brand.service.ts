import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CarBrand } from '../models/car-brand';

@Injectable({
  providedIn: 'root',
})
export class CarBrandService {
  private apiUrl = '/api/carbrand';

  constructor(private http: HttpClient) {}

  getBrands(): Observable<CarBrand[]> {
    return this.http.get<CarBrand[]>(this.apiUrl);
  }

  getBrand(id: number): Observable<CarBrand> {
    return this.http.get<CarBrand>(`${this.apiUrl}/${id}`);
  }

  addBrand(brand: CarBrand): Observable<any> {
    return this.http.post(this.apiUrl, brand);
  }

  updateBrand(brand: CarBrand): Observable<any> {
    return this.http.put(this.apiUrl, brand);
  }

  deleteBrand(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

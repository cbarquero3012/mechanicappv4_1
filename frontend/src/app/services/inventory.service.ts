import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Part } from '../models/part';
import { Product } from '../models/product';
import { MechanicService } from '../models/mechanic-service';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private partsUrl = '/api/part';
  private productsUrl = '/api/product';
  private servicesUrl = '/api/service';

  constructor(private http: HttpClient) {}

  // Parts
  getParts(): Observable<Part[]> {
    return this.http.get<Part[]>(this.partsUrl);
  }

  getPart(id: number): Observable<Part> {
    return this.http.get<Part>(`${this.partsUrl}/${id}`);
  }

  addPart(part: Part): Observable<any> {
    return this.http.post(this.partsUrl, part);
  }

  updatePart(part: Part): Observable<any> {
    return this.http.put(this.partsUrl, part);
  }

  deletePart(id: number): Observable<any> {
    return this.http.delete(`${this.partsUrl}/${id}`);
  }

  // Products
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.productsUrl);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.productsUrl}/${id}`);
  }

  addProduct(product: Product): Observable<any> {
    return this.http.post(this.productsUrl, product);
  }

  updateProduct(product: Product): Observable<any> {
    return this.http.put(this.productsUrl, product);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.productsUrl}/${id}`);
  }

  // Services
  getServices(): Observable<MechanicService[]> {
    return this.http.get<MechanicService[]>(this.servicesUrl);
  }

  getService(id: number): Observable<MechanicService> {
    return this.http.get<MechanicService>(`${this.servicesUrl}/${id}`);
  }

  addService(service: MechanicService): Observable<any> {
    return this.http.post(this.servicesUrl, service);
  }

  updateService(service: MechanicService): Observable<any> {
    return this.http.put(this.servicesUrl, service);
  }

  deleteService(id: number): Observable<any> {
    return this.http.delete(`${this.servicesUrl}/${id}`);
  }
}

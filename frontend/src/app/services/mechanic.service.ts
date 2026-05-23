import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mechanic, MechanicUserOption } from '../models/mechanic';

@Injectable({
  providedIn: 'root',
})
export class MechanicService {
  private apiUrl = '/api/mechanic';

  constructor(private http: HttpClient) {}

  getMechanics(): Observable<Mechanic[]> {
    return this.http.get<Mechanic[]>(this.apiUrl);
  }

  getMechanic(id: number): Observable<Mechanic> {
    return this.http.get<Mechanic>(`${this.apiUrl}/${id}`);
  }

  addMechanic(mechanic: Mechanic): Observable<any> {
    return this.http.post(this.apiUrl, mechanic);
  }

  updateMechanic(mechanic: Mechanic): Observable<any> {
    return this.http.put(this.apiUrl, mechanic);
  }

  deleteMechanic(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /** Get users with role=mechanic available for linking */
  getAvailableUsers(): Observable<MechanicUserOption[]> {
    return this.http.get<MechanicUserOption[]>(`${this.apiUrl}/available-users`);
  }
}

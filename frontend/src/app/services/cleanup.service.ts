import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CleanupResult {
  message: string;
  deletedRows: number;
  deletedFiles: number;
  cutoffDate: string;
  daysUsed: number;
  runBy: string;
}

export interface CleanupStatus {
  cleanupDays: number;
  lastRun?: string;
  lastUser?: string;
  totalPhotos: number;
}

@Injectable({
  providedIn: 'root',
})
export class CleanupService {
  private apiUrl = '/api/cleanup';

  constructor(private http: HttpClient) {}

  /** Get cleanup configuration and status */
  getStatus(): Observable<CleanupStatus> {
    return this.http.get<CleanupStatus>(`${this.apiUrl}/status`);
  }

  /** Manually trigger photo cleanup */
  runPhotoCleanup(days?: number): Observable<CleanupResult> {
    return this.http.post<CleanupResult>(`${this.apiUrl}/photos`, {
      days: days || null,
    });
  }
}

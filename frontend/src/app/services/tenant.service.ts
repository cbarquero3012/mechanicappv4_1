import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Tenant,
  CreateDemoResponse,
  DemoStatus,
  OnboardRequest,
} from '../models/tenant';

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  private apiUrl = '/api/tenant';
  private demoUrl = '/api/demo';
  private subscriptionUrl = '/api/subscription';

  /** Current demo tenant info (if applicable) */
  readonly demoInfo = signal<DemoStatus | null>(null);

  constructor(private http: HttpClient) {}

  // ──── Demo Endpoints ────

  createDemo(req: {
    name?: string;
    email?: string;
    username?: string;
    country?: string;
  }): Observable<CreateDemoResponse> {
    return this.http.post<CreateDemoResponse>(`${this.demoUrl}/create`, req);
  }

  getDemoStatus(slug: string): Observable<DemoStatus> {
    return this.http
      .get<DemoStatus>(`${this.demoUrl}/status/${slug}`)
      .pipe(tap((status) => this.demoInfo.set(status)));
  }

  upgradeDemo(req: {
    email: string;
    companyName: string;
    adminPassword?: string;
    username?: string;
    planName?: string;
    country?: string;
  }): Observable<any> {
    return this.http.post(`${this.demoUrl}/upgrade`, req);
  }

  // ──── Onboarding ────

  onboard(req: OnboardRequest): Observable<any> {
    return this.http.post(`${this.subscriptionUrl}/onboard`, req);
  }

  // ──── Admin Tenant Management ────

  getAll(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(this.apiUrl);
  }

  getBySlug(slug: string): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.apiUrl}/${slug}`);
  }

  create(req: {
    name: string;
    email: string;
    planName?: string;
  }): Observable<Tenant> {
    return this.http.post<Tenant>(this.apiUrl, req);
  }

  convertToPaid(
    id: number,
    req: { planName?: string; stripeSubscriptionId?: string },
  ): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.apiUrl}/${id}/convert`, req);
  }

  cleanupDemos(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/cleanup-demos`,
      {},
    );
  }
}

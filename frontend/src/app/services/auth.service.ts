import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';

export interface LoginResponse {
  token: string;
  username: string;
  expiration: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'mechanic_app_token';
  private readonly USER_KEY = 'mechanic_app_user';

  /** Reactive signal for logged-in state */
  readonly loggedIn = signal<boolean>(this.hasValidToken());

  constructor(private http: HttpClient) {}

  get isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  get currentUser(): string | null {
    return localStorage.getItem(this.USER_KEY);
  }

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Extract the user role from the JWT token payload */
  get userRole(): string {
    return (
      this.getTokenClaim('role') ||
      this.getTokenClaim(
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
      ) ||
      'mechanic'
    );
  }

  get isAdmin(): boolean {
    return this.userRole === 'admin' || this.userRole === 'super-admin';
  }

  get isSuperAdmin(): boolean {
    return this.userRole === 'super-admin';
  }

  get isSupervisor(): boolean {
    return this.userRole === 'supervisor';
  }

  get isMechanic(): boolean {
    return this.userRole === 'mechanic';
  }

  /** The mechanic record ID linked to this user (null if not a mechanic or not linked) */
  get mechanicId(): number | null {
    const val = this.getTokenClaim('mechanicId');
    return val ? parseInt(val, 10) : null;
  }

  /** Whether the current user can see prices, costs and totals */
  get canSeePrices(): boolean {
    return this.userRole === 'admin' || this.userRole === 'super-admin';
  }

  /** Check if user has access to a given section */
  hasAccess(section: string): boolean {
    const role = this.userRole;
    if (role === 'super-admin') return true;
    if (role === 'admin') {
      // admin cannot access super-admin-only sections
      if (section === 'superAdmin') return false;
      return true;
    }

    // admin-only sections
    if (section === 'admin' || section === 'superAdmin') return false;

    const supervisorSections = [
      'cars',
      'car-catalog',
      'inventory',
      'customers',
      'mechanics',
      'repair-orders',
      'payments',
      'users',
    ];
    const mechanicSections = ['repair-orders'];

    if (role === 'supervisor') return supervisorSections.includes(section);
    if (role === 'mechanic') return mechanicSections.includes(section);
    return false;
  }

  private getTokenClaim(claimKey: string): string | null {
    const t = this.token;
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload[claimKey] || null;
    } catch {
      return null;
    }
  }

  login(username: string, password: string): Observable<boolean> {
    return this.http
      .post<LoginResponse>('/api/auth/login', { username, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.USER_KEY, res.username);
          this.loggedIn.set(true);
        }),
        map(() => true),
        catchError(() => {
          this.loggedIn.set(false);
          return of(false);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.loggedIn.set(false);
  }

  /** Check if token exists and is not expired (pure — no side effects) */
  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to ms
      return Date.now() < exp;
    } catch {
      return false;
    }
  }
}

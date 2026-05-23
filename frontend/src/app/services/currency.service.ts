import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay, tap } from 'rxjs/operators';
import { Currency } from '../models/currency';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private apiUrl = '/api/currency';
  private defaultSymbol$?: Observable<string>;
  private defaultCurrencyId$?: Observable<number | undefined>;

  constructor(private http: HttpClient) {}

  getCurrencies(): Observable<Currency[]> {
    return this.http.get<Currency[]>(this.apiUrl);
  }

  getCurrency(id: number): Observable<Currency> {
    return this.http.get<Currency>(`${this.apiUrl}/${id}`);
  }

  addCurrency(currency: Currency): Observable<any> {
    return this.http
      .post(this.apiUrl, currency)
      .pipe(tap(() => this.clearCache()));
  }

  updateCurrency(currency: Currency): Observable<any> {
    return this.http
      .put(this.apiUrl, currency)
      .pipe(tap(() => this.clearCache()));
  }

  deleteCurrency(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.clearCache()));
  }

  /** Clear cached observables so the next call fetches fresh data */
  clearCache(): void {
    this.defaultSymbol$ = undefined;
    this.defaultCurrencyId$ = undefined;
  }

  /** Returns the symbol of the default currency (cached). Falls back to ₡ */
  getDefaultSymbol(): Observable<string> {
    if (!this.defaultSymbol$) {
      this.defaultSymbol$ = this.getActiveCurrencies().pipe(
        map((list) => {
          const def = list.find((c) => c.isDefault);
          return def?.symbol ?? '₡';
        }),
        catchError(() => of('₡')),
        shareReplay(1),
      );
    }
    return this.defaultSymbol$;
  }

  /** Returns the id of the default currency (cached). */
  getDefaultCurrencyId(): Observable<number | undefined> {
    if (!this.defaultCurrencyId$) {
      this.defaultCurrencyId$ = this.getActiveCurrencies().pipe(
        map((list) => list.find((c) => c.isDefault)?.id),
        catchError(() => of(undefined)),
        shareReplay(1),
      );
    }
    return this.defaultCurrencyId$;
  }

  /** Returns active currencies (always fresh from API). */
  getActiveCurrencies(): Observable<Currency[]> {
    return this.getCurrencies().pipe(
      map((list) => list.filter((c) => c.isActive)),
      catchError(() => of([])),
    );
  }
}

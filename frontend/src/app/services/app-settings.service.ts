import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AppSettings } from '../models/app-settings';

@Injectable({
  providedIn: 'root',
})
export class AppSettingsService {
  private apiUrl = '/api/appsettings';

  /** Reactive signal for settings */
  readonly settings = signal<AppSettings>({ appName: 'MechanicApp' });

  constructor(private http: HttpClient) {}

  /** Current snapshot (non-observable) */
  get current(): AppSettings {
    return this.settings();
  }

  /** IANA timezone identifier for this shop, e.g. "America/Costa_Rica". Defaults to UTC. */
  get timezone(): string {
    return this.settings().timezone || 'UTC';
  }

  /** Load settings from API and update signal */
  load(): Observable<AppSettings> {
    return this.http.get<AppSettings>(this.apiUrl).pipe(
      tap((s) => {
        this.settings.set(s);
        this.applyFavicon(s.faviconUrl);
        this.applyTitle(s.appName);
      }),
    );
  }

  /** Save settings to API and refresh */
  save(settings: AppSettings): Observable<any> {
    return this.http.put(this.apiUrl, settings).pipe(
      tap(() => {
        this.settings.set(settings);
        this.applyFavicon(settings.faviconUrl);
        this.applyTitle(settings.appName);
      }),
    );
  }

  /** Upload logo or favicon image file */
  uploadImage(
    file: File,
    type: 'logo' | 'favicon',
  ): Observable<{ url: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; fileName: string }>(
      `${this.apiUrl}/upload?type=${type}`,
      formData,
    );
  }

  /** Dynamically update the browser favicon */
  private applyFavicon(url?: string): void {
    if (!url) return;
    const link: HTMLLinkElement =
      document.querySelector("link[rel*='icon']") ||
      document.createElement('link');
    link.rel = 'icon';
    link.href = url;
    document.head.appendChild(link);
  }

  /** Dynamically update the browser tab title */
  private applyTitle(appName: string): void {
    document.title = appName;
  }
}

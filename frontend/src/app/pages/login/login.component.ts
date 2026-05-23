import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslationService, Lang } from '../../services/translation.service';
import { AppSettingsService } from '../../services/app-settings.service';
import { ToastService } from '../../services/toast.service';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-login',
  imports: [FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-lang-toggle">
          <button [class.active]="ts.lang === 'en'" (click)="ts.setLang('en')">
            EN
          </button>
          <button [class.active]="ts.lang === 'es'" (click)="ts.setLang('es')">
            ES
          </button>
        </div>

        @if (welcomeBanner) {
          <div class="welcome-banner">
            ✅ {{ 'login.welcomeNewAccount' | translate }}
          </div>
        }

        <div class="login-header">
          <img [src]="logo" [attr.alt]="appName" class="login-logo" />
          <h1>{{ appName }}</h1>
          <p>{{ 'login.title' | translate }}</p>
        </div>
        <form (ngSubmit)="onLogin()" #loginForm="ngForm">
          <div class="form-group">
            <label for="username">{{ 'login.username' | translate }}</label>
            <input
              id="username"
              [(ngModel)]="username"
              name="username"
              [placeholder]="'login.username.placeholder' | translate"
              required
              autofocus
            />
          </div>
          <div class="form-group">
            <label for="password">{{ 'login.password' | translate }}</label>
            <input
              id="password"
              [(ngModel)]="password"
              name="password"
              type="password"
              [placeholder]="'login.password.placeholder' | translate"
              required
            />
          </div>
          @if (errorMessage) {
            <div class="login-error">{{ errorMessage }}</div>
          }
          <button type="submit" [disabled]="!loginForm.valid || loading">
            {{
              loading
                ? ('login.submitting' | translate)
                : ('login.submit' | translate)
            }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: `
    .welcome-banner {
      background: linear-gradient(90deg, #166534, #15803d);
      color: #fff;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      text-align: center;
      font-weight: 500;
      font-size: 0.9rem;
    }
  `,
})
export class LoginComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('loginForm') loginForm!: NgForm;
  appName = 'Mechanic App';
  logo = '/assets/logo.svg';
  username = '';
  password = '';
  errorMessage = '';
  loading = false;
  welcomeBanner = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public ts: TranslationService,
    private appSettings: AppSettingsService,
    private toast: ToastService,
  ) {
    // If returning from onboarding/Stripe, recover credentials from sessionStorage
    const pending = sessionStorage.getItem('pending_onboarding');
    if (pending) {
      try {
        const data = JSON.parse(pending);
        this.username = data.credentials?.username || 'administrador';
        this.password = data.credentials?.password || '';
        this.welcomeBanner = true;
        sessionStorage.removeItem('pending_onboarding');
      } catch {
        sessionStorage.removeItem('pending_onboarding');
      }
    }
  }

  ngOnInit(): void {
    // Extract slug from URL and store for tenant resolution.
    // If the URL slug differs from the stored one, the user is switching tenants —
    // clear the previous session so the old token cannot bleed into the new tenant.
    //
    // Primary: parent route snapshot params.
    // Fallback: parse directly from the URL (e.g. /myshop/login → 'myshop').
    // The fallback guards against snapshot timing issues on first load with a clean cache.
    const routeSlug = this.route.parent?.snapshot.paramMap.get('slug');
    const urlParts = this.router.url.split('?')[0].split('/').filter(Boolean);
    const urlSlug =
      urlParts.length >= 2 && urlParts[urlParts.length - 1] === 'login'
        ? urlParts[urlParts.length - 2]
        : null;
    const slugParam = routeSlug || urlSlug;
    const prevSlug = localStorage.getItem('tenant_slug');
    if (slugParam) {
      if (prevSlug && prevSlug !== slugParam) {
        // Different tenant: clear the old auth session before switching
        this.authService.logout();
        this.appSettings.settings.set({ appName: 'Mechanic App' });
      }
      localStorage.setItem('tenant_slug', slugParam);
    }

    // Redirect already-authenticated users back to their dashboard.
    // This is safe now because the slug has already been set above.
    if (this.authService.isLoggedIn && !this.welcomeBanner) {
      const slug = localStorage.getItem('tenant_slug');
      this.router.navigate([slug ? `/${slug}/dashboard` : '/landing']);
      return;
    }

    // Auto-fill credentials when coming from demo creation
    if (!this.welcomeBanner) {
      const params = this.route.snapshot.queryParamMap;
      if (params.get('demo') === 'true') {
        this.username = params.get('username') || 'administrador';
        this.password = 'admin';
        this.welcomeBanner = true;
      }
    }

    this.appSettings
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((s) => {
        this.appName = s.appName;
        this.logo = s.logoUrl || '/assets/logo.svg';
      });
  }

  onLogin(): void {
    if (this.loginForm?.invalid) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.errorMessage = '';
    this.loading = true;
    this.authService
      .login(this.username, this.password)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (success) => {
          this.loading = false;
          if (success) {
            const slug = localStorage.getItem('tenant_slug');
            this.router.navigate([slug ? `/${slug}/dashboard` : '/landing']);
          } else {
            this.errorMessage = this.ts.t('login.error');
          }
        },
        error: () => {
          this.loading = false;
          this.errorMessage = this.ts.t('login.serverError');
        },
      });
  }
}

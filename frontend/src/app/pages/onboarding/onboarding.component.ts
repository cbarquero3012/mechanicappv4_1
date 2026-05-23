import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TenantService } from '../../services/tenant.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="onboarding-page">
      <div class="onboarding-card">
        <div class="lang-toggle">
          <button [class.active]="ts.lang === 'en'" (click)="ts.setLang('en')">
            EN
          </button>
          <button [class.active]="ts.lang === 'es'" (click)="ts.setLang('es')">
            ES
          </button>
        </div>

        <h2>{{ 'onboarding.title' | translate }}</h2>
        <p class="subtitle">{{ 'onboarding.subtitle' | translate }}</p>

        @if (!success) {
          <form (ngSubmit)="onSubmit()">
            @if (!isUpgradeMode) {
              <div class="form-group">
                <label>{{ 'onboarding.companyName' | translate }} *</label>
                <input
                  [(ngModel)]="companyName"
                  name="companyName"
                  required
                  [placeholder]="'onboarding.companyPlaceholder' | translate"
                />
              </div>
            }

            <div class="form-group">
              <label>{{ 'onboarding.email' | translate }} *</label>
              <input
                [(ngModel)]="email"
                name="email"
                type="email"
                required
                placeholder="admin@yourcompany.com"
              />
            </div>

            <div class="form-group">
              <label>{{ 'onboarding.username' | translate }}</label>
              <input
                [(ngModel)]="username"
                name="username"
                [placeholder]="'onboarding.usernamePlaceholder' | translate"
              />
            </div>

            <div class="form-group">
              <label>{{ 'onboarding.password' | translate }} *</label>
              <input
                [(ngModel)]="password"
                name="password"
                type="password"
                required
                minlength="6"
                [placeholder]="'onboarding.passwordPlaceholder' | translate"
              />
            </div>

            <div class="form-group">
              <label>{{ 'onboarding.plan' | translate }}</label>
              <select [(ngModel)]="plan" name="plan">
                <option value="standard">
                  Standard - $49/{{ 'landing.month' | translate }}
                </option>
                <option value="premium">
                  Premium - $79/{{ 'landing.month' | translate }}
                </option>
                <option value="platinum">
                  Platinum - $99/{{ 'landing.month' | translate }}
                </option>
                <option value="golden">
                  Golden - {{ 'landing.contactUs' | translate }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ 'onboarding.country' | translate }}</label>
              <select [(ngModel)]="country" name="country">
                <option value="">
                  {{ 'onboarding.countryPlaceholder' | translate }}
                </option>
                @for (c of countries; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>

            @if (error) {
              <p class="error-msg">{{ error }}</p>
            }

            <button
              type="submit"
              class="btn btn-primary btn-lg full-width"
              [disabled]="loading"
            >
              {{
                loading
                  ? ('onboarding.processing' | translate)
                  : isUpgradeMode
                    ? ('demo.upgrade' | translate)
                    : ('onboarding.createAccount' | translate)
              }}
            </button>
          </form>

          <p class="login-link">
            {{ 'onboarding.alreadyHave' | translate }}
            <a routerLink="/login">{{ 'login.submit' | translate }}</a>
          </p>
          <p class="demo-link">
            {{ 'onboarding.wantDemo' | translate }}
            <a routerLink="/landing">{{ 'landing.tryDemo' | translate }}</a>
          </p>
        }

        @if (success) {
          <div class="success-section">
            <div class="success-icon">🎉</div>
            <h3>{{ 'onboarding.successTitle' | translate }}</h3>
            <p>{{ 'onboarding.successMsg' | translate }}</p>

            <div class="account-details">
              <p>
                <strong>{{ 'onboarding.yourCredentials' | translate }}:</strong>
              </p>
              <div class="credentials-box">
                <p>
                  👤 {{ 'login.username' | translate }}:
                  <strong>{{ credentials.username }}</strong>
                </p>
                <p>
                  🔑 {{ 'login.password' | translate }}:
                  <strong>{{ credentials.password }}</strong>
                </p>
              </div>

              <p>
                <strong>{{ 'onboarding.loginLink' | translate }}:</strong>
                <a
                  [href]="getLoginUrl()"
                  class="login-url-link"
                  target="_blank"
                  >{{ getLoginUrl() }}</a
                >
              </p>

              <p>
                <strong>{{ 'onboarding.plan' | translate }}:</strong>
                {{ successData.planName }}
              </p>

              <p class="grace-note">
                ⏱️ {{ 'onboarding.gracePeriod' | translate }}
              </p>
            </div>

            @if (plan === 'golden') {
              <p class="payment-note">
                {{ 'onboarding.enterpriseNote' | translate }}
              </p>
              <a
                href="mailto:sales@mechanicapp.com"
                class="btn btn-primary btn-lg full-width payment-btn"
              >
                ✉️ {{ 'landing.contactSales' | translate }}
              </a>
            }

            <button
              class="btn btn-primary btn-lg full-width"
              (click)="goToLogin()"
            >
              {{ 'onboarding.goToLogin' | translate }} →
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .onboarding-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 2rem;
    }
    .onboarding-card {
      background: #1e293b;
      border-radius: 12px;
      padding: 2.5rem;
      max-width: 480px;
      width: 100%;
      color: #fff;
      position: relative;
    }
    .lang-toggle {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.25rem;
    }
    .lang-toggle button {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .lang-toggle button.active {
      background: rgba(255, 255, 255, 0.2);
    }
    h2 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
    }
    .subtitle {
      color: rgba(255, 255, 255, 0.6);
      margin: 0 0 2rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.3rem;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
    }
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 0.7rem 0.75rem;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      font-size: 0.95rem;
    }
    .form-group select {
      background: #1e293b;
      color: #fff;
      appearance: auto;
    }
    .form-group select option {
      background: #1e293b;
      color: #fff;
    }
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .btn-primary {
      background: #2563eb;
      color: #fff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-lg {
      padding: 0.9rem 2rem;
      font-size: 1.05rem;
    }
    .full-width {
      width: 100%;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .error-msg {
      color: #f87171;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    .login-link,
    .demo-link {
      text-align: center;
      margin-top: 1rem;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
    }
    .login-link a,
    .demo-link a {
      color: #60a5fa;
      text-decoration: none;
    }
    .success-section {
      text-align: center;
    }
    .success-icon {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }
    .success-section h3 {
      margin: 0 0 0.5rem;
    }
    .success-section p {
      color: rgba(255, 255, 255, 0.7);
    }
    .account-details {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 1rem;
      margin: 1.5rem 0;
      text-align: left;
    }
    .account-details code {
      display: block;
      background: rgba(0, 0, 0, 0.4);
      padding: 0.5rem;
      border-radius: 4px;
      margin: 0.5rem 0;
      word-break: break-all;
    }
    .credentials-box {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 6px;
      padding: 0.75rem;
      margin: 0.5rem 0 1rem;
    }
    .credentials-box p {
      margin: 0.25rem 0;
      color: #fff;
    }
    .login-url-link {
      display: block;
      background: rgba(0, 0, 0, 0.4);
      color: #60a5fa;
      padding: 0.5rem;
      border-radius: 4px;
      margin: 0.5rem 0;
      word-break: break-all;
      text-decoration: none;
      font-family: monospace;
      font-size: 0.9rem;
    }
    .login-url-link:hover {
      text-decoration: underline;
    }
    .grace-note {
      color: #fbbf24;
      font-size: 0.85rem;
      margin-top: 0.75rem;
    }
    .btn-outline {
      background: transparent;
      color: #fff;
      border: 2px solid rgba(255, 255, 255, 0.3);
      margin-top: 0.75rem;
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .payment-note {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    .payment-btn {
      display: block;
      text-align: center;
      text-decoration: none;
    }
  `,
})
export class OnboardingComponent implements OnInit {
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  ts = inject(TranslationService);

  companyName = '';
  email = '';
  username = '';
  password = '';
  plan = 'standard';
  country = '';
  loading = false;
  error = '';
  success = false;
  successData: any = {};
  credentials = { username: '', password: '' };
  isUpgradeMode = false;
  upgradeEmail = ''; // pre-filled email from demo session

  readonly countries = [
    'Costa Rica',
    'Guatemala',
    'El Salvador',
    'Honduras',
    'Nicaragua',
    'Panamá',
    'Belize',
    'México',
    'United States',
    'Canada',
    'Cuba',
    'Dominican Republic',
    'Puerto Rico',
    'Jamaica',
    'Haiti',
    'Trinidad and Tobago',
    'Colombia',
    'Venezuela',
    'Ecuador',
    'Perú',
    'Bolivia',
    'Chile',
    'Brasil',
    'Argentina',
    'Uruguay',
    'Paraguay',
    'Guyana',
    'Suriname',
    'Spain',
    'Portugal',
    'France',
    'Germany',
    'Italy',
    'United Kingdom',
    'Other',
  ];

  ngOnInit() {
    // Pre-select plan from query param
    const planParam = this.route.snapshot.queryParamMap.get('plan');
    if (
      planParam &&
      ['standard', 'premium', 'platinum', 'golden'].includes(planParam)
    ) {
      this.plan = planParam;
    }

    // Detect upgrade mode (?mode=upgrade from demo banner)
    this.isUpgradeMode =
      this.route.snapshot.queryParamMap.get('mode') === 'upgrade';

    // Check if returning from Stripe payment — recover stored onboarding data
    const pending = sessionStorage.getItem('pending_onboarding');
    if (pending) {
      try {
        const data = JSON.parse(pending);
        this.success = true;
        this.successData = data.tenant || {};
        this.credentials = data.credentials || {
          username: 'administrador',
          password: '',
        };
        this.plan = data.plan || 'standard';
        this.isUpgradeMode = data.isUpgradeMode || false;
      } catch {
        sessionStorage.removeItem('pending_onboarding');
      }
    }
  }

  onSubmit() {
    if (this.isUpgradeMode) {
      // Upgrade mode: must have email and password; company name not required
      if (!this.email || !this.password) {
        this.error = 'Email and password are required';
        return;
      }
    } else {
      if (!this.companyName || !this.email || !this.password) {
        this.error = 'All fields are required';
        return;
      }
    }
    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    this.loading = true;
    this.error = '';

    if (this.isUpgradeMode) {
      // ── Demo → Paid upgrade ──
      this.tenantService
        .upgradeDemo({
          email: this.email,
          companyName: this.companyName || this.email,
          adminPassword: this.password,
          username: this.username || undefined,
          planName: this.plan,
          country: this.country || undefined,
        })
        .subscribe({
          next: (res) => {
            const slug = res.tenant?.slug;
            if (slug) localStorage.setItem('tenant_slug', slug);

            const onboardingData = {
              tenant: res.tenant,
              credentials: {
                username:
                  res.credentials?.username || this.username || 'administrador',
                password: this.password,
              },
              plan: this.plan,
              isUpgradeMode: true,
            };
            sessionStorage.setItem(
              'pending_onboarding',
              JSON.stringify(onboardingData),
            );

            this.success = true;
            this.successData = res.tenant || {};
            this.credentials = onboardingData.credentials;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.error = err.error?.message || 'Upgrade failed';
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
      return;
    }

    this.tenantService
      .onboard({
        email: this.email,
        companyName: this.companyName,
        adminPassword: this.password,
        username: this.username || undefined,
        planName: this.plan,
        country: this.country || undefined,
      })
      .subscribe({
        next: (res) => {
          // Store tenant slug so all API calls use the new tenant DB
          const slug = res.tenant?.slug;
          if (slug) {
            localStorage.setItem('tenant_slug', slug);
          }

          // Prepare onboarding data for recovery after Stripe redirect
          const onboardingData = {
            tenant: res.tenant,
            credentials: {
              username: res.credentials?.username || 'administrador',
              password: this.password,
            },
            plan: this.plan,
          };
          sessionStorage.setItem(
            'pending_onboarding',
            JSON.stringify(onboardingData),
          );

          // For paid plans with Stripe link: redirect to payment immediately
          const paymentUrl = res.paymentUrl || '';
          if (paymentUrl && this.plan !== 'golden') {
            window.location.href = paymentUrl;
            return;
          }

          // For golden/enterprise or no payment URL: show success directly
          this.success = true;
          this.successData = res.tenant || {};
          this.credentials = onboardingData.credentials;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create account';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  getLoginUrl(): string {
    const slug = this.successData?.slug;
    return slug
      ? `${window.location.origin}/${slug}/login`
      : `${window.location.origin}/login`;
  }

  goToLogin() {
    sessionStorage.removeItem('pending_onboarding');
    const slug = this.successData?.slug;
    if (slug) {
      this.router.navigate([`/${slug}/login`]);
    } else {
      this.router.navigate(['/login']);
    }
  }
}

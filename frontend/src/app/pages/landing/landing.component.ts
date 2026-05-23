import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { TenantService } from '../../services/tenant.service';
import { TranslationService } from '../../services/translation.service';
import { AppSettingsService } from '../../services/app-settings.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FormsModule, RouterModule, DatePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="landing-page">
      <div class="landing-header">
        <div class="lang-toggle">
          <button [class.active]="ts.lang === 'en'" (click)="ts.setLang('en')">
            EN
          </button>
          <button [class.active]="ts.lang === 'es'" (click)="ts.setLang('es')">
            ES
          </button>
        </div>
        <div class="brand">
          <img src="/assets/logo.svg" alt="Mechanic App" class="landing-logo" />
          <h1>Mechanic App</h1>
        </div>
        <a routerLink="/login" class="btn-login">{{
          'login.submit' | translate
        }}</a>
      </div>

      <section class="hero">
        <h2>{{ 'landing.heroTitle' | translate }}</h2>
        <p class="hero-subtitle">{{ 'landing.heroSubtitle' | translate }}</p>

        <div class="cta-buttons">
          <button
            class="btn btn-primary btn-lg"
            (click)="showDemoForm = true"
            [disabled]="loading"
          >
            🚀 {{ 'landing.tryDemo' | translate }}
          </button>
          <a routerLink="/onboarding" class="btn btn-outline btn-lg">
            {{ 'landing.getStarted' | translate }}
          </a>
        </div>
      </section>

      @if (showDemoForm) {
        <div class="modal-overlay" (click)="showDemoForm = false">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h3>{{ 'landing.demoTitle' | translate }}</h3>
            <p>{{ 'landing.demoDesc' | translate }}</p>

            <form (ngSubmit)="createDemo()">
              <div class="form-group">
                <label>{{ 'landing.companyName' | translate }}</label>
                <input
                  [(ngModel)]="demoName"
                  name="demoName"
                  [placeholder]="'landing.companyPlaceholder' | translate"
                />
              </div>
              <div class="form-group">
                <label>{{ 'landing.username' | translate }}</label>
                <input
                  [(ngModel)]="demoUsername"
                  name="demoUsername"
                  [placeholder]="'landing.usernamePlaceholder' | translate"
                />
              </div>
              <div class="form-group">
                <label
                  >{{ 'landing.email' | translate }} ({{
                    'landing.optional' | translate
                  }})</label
                >
                <input
                  [(ngModel)]="demoEmail"
                  name="demoEmail"
                  type="email"
                  placeholder="you{'@'}company.com"
                />
              </div>
              <div class="form-group">
                <label>{{ 'landing.country' | translate }}</label>
                <select [(ngModel)]="demoCountry" name="demoCountry">
                  <option value="">{{ 'landing.countryPlaceholder' | translate }}</option>
                  @for (c of countries; track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
              </div>

              @if (error) {
                <p class="error-msg">{{ error }}</p>
              }

              <div class="form-actions">
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="showDemoForm = false"
                >
                  {{ 'common.cancel' | translate }}
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="loading"
                >
                  {{
                    loading
                      ? ('landing.creating' | translate)
                      : ('landing.createDemo' | translate)
                  }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (demoCreated) {
        <div class="modal-overlay" (click)="demoCreated = null">
          <div class="modal-card success" (click)="$event.stopPropagation()">
            <h3>✅ {{ 'landing.demoReady' | translate }}</h3>
            <div class="demo-details">
              <p>
                <strong>{{ 'landing.credentials' | translate }}:</strong>
              </p>
              <div class="credentials-box">
                <p>
                  👤 {{ 'login.username' | translate }}:
                  <strong>{{ demoCreated.tenant.credentials.username }}</strong>
                </p>
                <p>
                  🔑 {{ 'login.password' | translate }}:
                  <strong>{{ demoCreated.tenant.credentials.password }}</strong>
                </p>
              </div>

              <p>
                <strong>{{ 'landing.loginLink' | translate }}:</strong>
                <a [href]="getDemoLoginUrl()" class="login-url-link" target="_blank">{{ getDemoLoginUrl() }}</a>
              </p>

              <p class="expires-info">
                ⏱️ {{ 'landing.demoExpires' | translate }}:
                {{ demoCreated.tenant.demoExpiresAt | date: 'mediumDate' }}
              </p>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" (click)="goToDemo()">
                {{ 'landing.openDemo' | translate }} →
              </button>
            </div>
          </div>
        </div>
      }

      <section class="features">
        <h3>{{ 'landing.featuresTitle' | translate }}</h3>
        <div class="feature-grid">
          <div class="feature-card">
            <span class="feature-icon">🔧</span>
            <h4>{{ 'landing.feature1Title' | translate }}</h4>
            <p>{{ 'landing.feature1Desc' | translate }}</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">📦</span>
            <h4>{{ 'landing.feature2Title' | translate }}</h4>
            <p>{{ 'landing.feature2Desc' | translate }}</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">👥</span>
            <h4>{{ 'landing.feature3Title' | translate }}</h4>
            <p>{{ 'landing.feature3Desc' | translate }}</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">💰</span>
            <h4>{{ 'landing.feature4Title' | translate }}</h4>
            <p>{{ 'landing.feature4Desc' | translate }}</p>
          </div>
        </div>
      </section>

      <section class="pricing">
        <h3>{{ 'landing.pricingTitle' | translate }}</h3>
        <div class="pricing-grid">
          <div class="pricing-card demo">
            <h4>{{ 'landing.planFreeTrial' | translate }}</h4>
            <p class="price">{{ 'landing.free' | translate }}</p>
            <ul>
              <li>✓ 7 {{ 'landing.days' | translate }}</li>
              <li>✓ 3 {{ 'landing.users' | translate }}</li>
              <li>✓ {{ 'landing.allFeatures' | translate }}</li>
              <li>✓ {{ 'landing.sampleData' | translate }}</li>
            </ul>
            <button class="btn btn-outline" (click)="showDemoForm = true">
              {{ 'landing.tryDemo' | translate }}
            </button>
          </div>
          <div class="pricing-card standard">
            <div class="popular-badge">{{ 'landing.popular' | translate }}</div>
            <h4>{{ 'landing.planStandard' | translate }}</h4>
            <p class="price">
              $49<span>/{{ 'landing.month' | translate }}</span>
            </p>
            <ul>
              <li>✓ 5 {{ 'landing.users' | translate }}</li>
              <li>✓ {{ 'landing.allFeatures' | translate }}</li>
              <li>✓ {{ 'landing.dedicatedDb' | translate }}</li>
              <li>✓ {{ 'landing.emailSupport' | translate }}</li>
            </ul>
            <a
              routerLink="/onboarding"
              [queryParams]="{ plan: 'standard' }"
              class="btn btn-primary"
            >
              {{ 'landing.getStarted' | translate }}
            </a>
          </div>
          <div class="pricing-card premium">
            <h4>{{ 'landing.planPremium' | translate }}</h4>
            <p class="price">
              $79<span>/{{ 'landing.month' | translate }}</span>
            </p>
            <ul>
              <li>✓ 15 {{ 'landing.users' | translate }}</li>
              <li>✓ {{ 'landing.allFeatures' | translate }}</li>
              <li>✓ {{ 'landing.dedicatedDb' | translate }}</li>
              <li>✓ {{ 'landing.prioritySupport' | translate }}</li>
            </ul>
            <a
              routerLink="/onboarding"
              [queryParams]="{ plan: 'premium' }"
              class="btn btn-outline"
            >
              {{ 'landing.getStarted' | translate }}
            </a>
          </div>
          <div class="pricing-card platinum">
            <h4>{{ 'landing.planPlatinum' | translate }}</h4>
            <p class="price">
              $99<span>/{{ 'landing.month' | translate }}</span>
            </p>
            <ul>
              <li>✓ 25 {{ 'landing.users' | translate }}</li>
              <li>✓ {{ 'landing.allFeatures' | translate }}</li>
              <li>✓ {{ 'landing.dedicatedDb' | translate }}</li>
              <li>✓ {{ 'landing.prioritySupport' | translate }}</li>
              <li>✓ {{ 'landing.customBranding' | translate }}</li>
            </ul>
            <a
              routerLink="/onboarding"
              [queryParams]="{ plan: 'platinum' }"
              class="btn btn-outline"
            >
              {{ 'landing.getStarted' | translate }}
            </a>
          </div>
          <div class="pricing-card golden">
            <h4>{{ 'landing.planGolden' | translate }}</h4>
            <p class="price">{{ 'landing.contactUs' | translate }}</p>
            <ul>
              <li>✓ 25+ {{ 'landing.users' | translate }}</li>
              <li>✓ {{ 'landing.allFeatures' | translate }}</li>
              <li>✓ {{ 'landing.dedicatedDb' | translate }}</li>
              <li>✓ {{ 'landing.prioritySupport' | translate }}</li>
              <li>✓ {{ 'landing.customBranding' | translate }}</li>
              <li>✓ {{ 'landing.dedicatedManager' | translate }}</li>
            </ul>
            <a href="mailto:sales@mechanicapp.com" class="btn btn-outline">
              {{ 'landing.contactSales' | translate }}
            </a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: `
    .landing-page {
      min-height: 100vh;
      background: linear-gradient(
        135deg,
        #1a1a2e 0%,
        #16213e 50%,
        #0f3460 100%
      );
      color: #fff;
    }
    .landing-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .landing-logo {
      width: 40px;
      height: 40px;
    }
    .brand h1 {
      font-size: 1.5rem;
      margin: 0;
    }
    .lang-toggle {
      display: flex;
      gap: 0.25rem;
    }
    .lang-toggle button {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
    }
    .lang-toggle button.active {
      background: rgba(255, 255, 255, 0.2);
    }
    .btn-login {
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.5);
      padding: 0.5rem 1.25rem;
      border-radius: 6px;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn-login:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .hero {
      text-align: center;
      padding: 4rem 2rem 3rem;
    }
    .hero h2 {
      font-size: 2.75rem;
      margin-bottom: 0.75rem;
      background: linear-gradient(to right, #fff, #90caf9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.7);
      max-width: 600px;
      margin: 0 auto 2rem;
    }
    .cta-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;
      display: inline-block;
    }
    .btn-primary {
      background: #2563eb;
      color: #fff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-outline {
      background: transparent;
      color: #fff;
      border: 2px solid rgba(255, 255, 255, 0.5);
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .btn-secondary {
      background: #374151;
      color: #fff;
    }
    .btn-lg {
      padding: 1rem 2rem;
      font-size: 1.1rem;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .features {
      padding: 3rem 2rem;
      text-align: center;
    }
    .features h3 {
      font-size: 2rem;
      margin-bottom: 2rem;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      max-width: 1000px;
      margin: 0 auto;
    }
    .feature-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 2rem;
    }
    .feature-icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 0.75rem;
    }
    .feature-card h4 {
      margin: 0 0 0.5rem;
    }
    .feature-card p {
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
      font-size: 0.9rem;
    }

    .pricing {
      padding: 3rem 2rem;
      text-align: center;
    }
    .pricing h3 {
      font-size: 2rem;
      margin-bottom: 2rem;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .pricing-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 2rem;
      position: relative;
    }
    .pricing-card.standard {
      border-color: #2563eb;
      transform: scale(1.02);
    }
    .pricing-card.golden {
      border-color: #d4a017;
      background: rgba(212, 160, 23, 0.08);
    }
    .popular-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: #2563eb;
      color: #fff;
      padding: 0.25rem 1rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .price {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0.5rem 0;
    }
    .price span {
      font-size: 1rem;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.5);
    }
    .pricing-card ul {
      list-style: none;
      padding: 0;
      margin: 1.5rem 0;
      text-align: left;
    }
    .pricing-card li {
      padding: 0.4rem 0;
      color: rgba(255, 255, 255, 0.8);
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-card {
      background: #1e293b;
      border-radius: 12px;
      padding: 2rem;
      max-width: 450px;
      width: 100%;
    }
    .modal-card.success {
      border: 2px solid #22c55e;
    }
    .modal-card h3 {
      margin: 0 0 0.75rem;
    }
    .modal-card p {
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 1rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
    }
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      font-size: 0.95rem;
    }
    .form-group select {
      background: #1e293b;
      color: #fff;
    }
    .form-group select option {
      background: #1e293b;
      color: #fff;
    }
    .form-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }
    .error-msg {
      color: #f87171;
      font-size: 0.85rem;
    }
    .demo-details {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }
    .demo-details code {
      display: block;
      background: rgba(0, 0, 0, 0.4);
      padding: 0.5rem;
      border-radius: 4px;
      margin: 0.5rem 0;
      word-break: break-all;
    }
    .credentials-box {
      background: rgba(0, 0, 0, 0.4);
      border-radius: 6px;
      padding: 0.75rem 1rem;
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
    .expires-info {
      color: #fbbf24;
      margin-top: 0.75rem;
    }
  `,
})
export class LandingComponent {
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  ts = inject(TranslationService);

  showDemoForm = false;
  demoName = '';
  demoUsername = '';
  demoEmail = '';
  demoCountry = '';
  loading = false;
  error = '';
  demoCreated: any = null;

  readonly countries = [
    'Costa Rica', 'Guatemala', 'El Salvador', 'Honduras', 'Nicaragua', 'Panamá', 'Belize',
    'México', 'United States', 'Canada',
    'Cuba', 'Dominican Republic', 'Puerto Rico', 'Jamaica', 'Haiti', 'Trinidad and Tobago',
    'Colombia', 'Venezuela', 'Ecuador', 'Perú', 'Bolivia', 'Chile', 'Brasil', 'Argentina',
    'Uruguay', 'Paraguay', 'Guyana', 'Suriname',
    'Spain', 'Portugal', 'France', 'Germany', 'Italy', 'United Kingdom',
    'Other',
  ];

  createDemo() {
    this.loading = true;
    this.error = '';

    this.tenantService
      .createDemo({
        name: this.demoName || undefined,
        email: this.demoEmail || undefined,
        username: this.demoUsername || undefined,
        country: this.demoCountry || undefined,
      })
      .subscribe({
        next: (res) => {
          // Store tenant slug so all subsequent API calls use the new DB
          if (res.tenant?.slug) {
            localStorage.setItem('tenant_slug', res.tenant.slug);
          }
          // Clear any stale auth from a previous session
          this.authService.logout();
          // Show success modal with credentials
          this.demoCreated = res;
          this.showDemoForm = false;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create demo';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  getDemoLoginUrl(): string {
    const slug = this.demoCreated?.tenant?.slug;
    return slug ? `${window.location.origin}/${slug}/login` : '';
  }

  goToDemo() {
    const slug = this.demoCreated?.tenant?.slug;
    if (slug) {
      this.router.navigate([`/${slug}/login`]);
    } else {
      this.router.navigate(['/login']);
    }
  }
}

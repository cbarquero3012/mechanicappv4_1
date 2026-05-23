import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  OnInit,
  computed,
  effect,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SubscriptionService } from '../../services/subscription.service';
import { AppSettingsService } from '../../services/app-settings.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { SubscriptionStatus, Subscription } from '../../models/subscription';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-subscription',
  imports: [LocalDatePipe, FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="subscription-page">
      <div class="subscription-card">
        <div class="brand-header">
          @if (logo()) {
            <img [src]="logo()" [alt]="appName()" class="brand-logo" />
          }
          <h1>{{ appName() }}</h1>
        </div>

        <div class="status-section">
          <div
            class="status-badge"
            [class.active]="status?.active"
            [class.expired]="!status?.active"
          >
            {{
              status?.active
                ? ('subscription.active' | translate)
                : ('subscription.expired' | translate)
            }}
          </div>
          @if (status?.planName) {
            <p class="plan-info">
              <strong>{{ 'subscription.plan' | translate }}:</strong>
              {{ status?.planName }}
            </p>
          }
          @if (status?.expiresAt) {
            <p class="expiry-info">
              <strong>{{ 'subscription.expiresAt' | translate }}:</strong>
              {{ status?.expiresAt | localDate: 'medium' }}
            </p>
          }
        </div>

        @if (!status?.active) {
          <div class="action-section">
            <p class="expired-text">
              {{ 'subscription.expiredMsg' | translate }}
            </p>
            @if (checkoutUrl) {
              <a
                [href]="checkoutUrl"
                target="_blank"
                class="btn btn-primary btn-lg"
              >
                &#128179; {{ 'subscription.subscribe' | translate }}
              </a>
            }
            @if (!checkoutUrl) {
              <p class="hint">
                {{ 'subscription.contactAdmin' | translate }}
              </p>
            }
          </div>
        }

        @if (status?.active) {
          <div class="action-section">
            <p class="active-text">
              {{ 'subscription.activeMsg' | translate }}
            </p>
            <a routerLink="../dashboard" class="btn btn-primary btn-lg">
              {{ 'subscription.goToDashboard' | translate }}
            </a>
          </div>
        }

        <!-- Admin override (manual activation for testing) -->
        @if (isAdmin) {
          <details class="admin-section">
            <summary>{{ 'subscription.adminOverride' | translate }}</summary>
            <div class="admin-form">
              <div class="form-group">
                <label>{{ 'subscription.planName' | translate }}</label>
                <input
                  type="text"
                  name="manualPlan"
                  [(ngModel)]="manualPlan"
                  placeholder="e.g. Monthly"
                />
              </div>
              <div class="form-group">
                <label>{{ 'subscription.expiresAt' | translate }}</label>
                <input
                  type="date"
                  name="manualExpires"
                  [(ngModel)]="manualExpires"
                />
              </div>
              <button
                class="btn btn-outline"
                (click)="manualActivate()"
                [disabled]="activating"
              >
                {{ 'subscription.activate' | translate }}
              </button>
              @if (activateMsg) {
                <div class="success-message">
                  {{ activateMsg }}
                </div>
              }
            </div>
          </details>
        }

        <div class="footer-actions">
          <button class="btn btn-outline btn-sm" (click)="refreshStatus()">
            &#128260; {{ 'subscription.refresh' | translate }}
          </button>
          <button class="btn btn-outline btn-sm" (click)="logout()">
            {{ 'nav.logout' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .subscription-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
      }
      .subscription-card {
        background: #fff;
        border-radius: 16px;
        padding: 40px;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
      }
      .brand-header {
        margin-bottom: 24px;
      }
      .brand-logo {
        height: 60px;
        margin-bottom: 12px;
      }
      .brand-header h1 {
        margin: 0;
        font-size: 1.6rem;
        color: #333;
      }
      .status-section {
        margin: 20px 0;
      }
      .status-badge {
        display: inline-block;
        padding: 8px 24px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .status-badge.active {
        background: #d4edda;
        color: #155724;
      }
      .status-badge.expired {
        background: #f8d7da;
        color: #721c24;
      }
      .plan-info,
      .expiry-info {
        margin: 8px 0;
        font-size: 0.95rem;
        color: #555;
      }
      .action-section {
        margin: 24px 0;
      }
      .expired-text {
        color: #721c24;
        margin-bottom: 16px;
      }
      .active-text {
        color: #155724;
        margin-bottom: 16px;
      }
      .btn-lg {
        padding: 12px 32px;
        font-size: 1.1rem;
      }
      .hint {
        color: #888;
        font-size: 0.9rem;
        margin-top: 12px;
      }
      .admin-section {
        margin-top: 24px;
        text-align: left;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 12px;
      }
      .admin-section summary {
        cursor: pointer;
        font-weight: 600;
        color: #6c757d;
      }
      .admin-form {
        margin-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .admin-form input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      .footer-actions {
        margin-top: 24px;
        display: flex;
        gap: 12px;
        justify-content: center;
      }
    `,
  ],
})
export class SubscriptionComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  status: SubscriptionStatus | null = null;
  checkoutUrl = '';
  isAdmin = false;

  /** Read branding from signals */
  readonly appName = computed(() => this.appSettings.settings().appName);
  readonly logo = computed(() => this.appSettings.settings().logoUrl || '');

  manualPlan = 'Monthly';
  manualExpires = '';
  activating = false;
  activateMsg = '';

  constructor(
    private subService: SubscriptionService,
    private appSettings: AppSettingsService,
    private authService: AuthService,
    private router: Router,
    public ts: TranslationService,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isSuperAdmin;

    // Set default expiry to 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    this.manualExpires = d.toISOString().split('T')[0];

    this.refreshStatus();
  }

  refreshStatus(): void {
    this.subService
      .checkStatus()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((s) => {
        this.status = s;
      });
    this.subService
      .getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (c) => (this.checkoutUrl = c.checkoutUrl || ''),
      });
  }

  manualActivate(): void {
    this.activating = true;
    this.subService
      .activate({
        email: 'admin@mechanicapp.local',
        planName: this.manualPlan,
        expiresAt: this.manualExpires
          ? new Date(this.manualExpires).toISOString()
          : undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.activating = false;
          this.activateMsg = this.ts.t('subscription.activated');
          this.refreshStatus();
          setTimeout(() => (this.activateMsg = ''), 3000);
        },
        error: () => {
          this.activating = false;
        },
      });
  }

  logout(): void {
    this.authService.logout();
    const slug = localStorage.getItem('tenant_slug');
    this.router.navigate([slug ? `/${slug}/login` : '/landing']);
  }
}

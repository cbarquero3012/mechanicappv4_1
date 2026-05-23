import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  SubscriptionService,
  SubscriptionConfig,
} from '../../services/subscription.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';
import { SubscriptionStatus, Subscription } from '../../models/subscription';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-subscription-manage',
  imports: [FormsModule, RouterModule, LocalDatePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h2>{{ 'subscription.management' | translate }}</h2>
      <p class="subtitle">{{ 'subscription.managementDesc' | translate }}</p>
    </div>

    <!-- Status Card -->
    <div
      class="card status-card"
      [class.active]="status?.active && !status?.isDemo"
      [class.demo]="status?.isDemo"
      [class.expired]="!status?.active"
    >
      <div class="status-header">
        <div
          class="status-badge-lg"
          [class.badge-active]="status?.active && !status?.isDemo"
          [class.badge-demo]="status?.isDemo"
          [class.badge-expired]="!status?.active"
        >
          {{
            status?.isDemo
              ? ('subscription.demo' | translate)
              : status?.active
                ? ('subscription.active' | translate)
                : statusLabel
          }}
        </div>
        <button
          class="btn btn-outline btn-sm"
          (click)="refreshAll()"
          [disabled]="loading"
        >
          &#128260; {{ 'subscription.refresh' | translate }}
        </button>
      </div>

      @if (status) {
        <div class="status-details">
          <div class="detail-row">
            <span class="label">{{ 'subscription.plan' | translate }}</span>
            <span class="value">{{ getPlanLabel(status.planName) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'subscription.email' | translate }}</span>
            <span class="value">{{ status.email || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{
              'subscription.expiresAt' | translate
            }}</span>
            <span class="value" [class.expiring-soon]="isExpiringSoon">
              {{
                status.expiresAt
                  ? (status.expiresAt | localDate: 'medium')
                  : ('subscription.noExpiry' | translate)
              }}
              @if (daysLeft !== null && daysLeft >= 0) {
                <span class="days-left">
                  ({{ daysLeft }} {{ 'subscription.daysLeft' | translate }})
                </span>
              }
            </span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'common.status' | translate }}</span>
            <span class="value status-text" [class]="'st-' + status.status">{{
              getStatusLabel(status.status)
            }}</span>
          </div>
        </div>
      }

      <!-- Expiring soon warning -->
      @if (isExpiringSoon) {
        <div class="warning-banner">
          &#9888;&#65039; {{ 'subscription.expiringWarning' | translate }}
          {{ status?.expiresAt | localDate: 'mediumDate' }}
        </div>
      }

      <!-- Actions -->
      <div class="status-actions">
        @if (checkoutUrl) {
          @if (status?.active) {
            <button class="btn btn-primary" disabled>
              &#128179; {{ 'subscription.subscribe' | translate }}
            </button>
          } @else {
            <a [href]="checkoutUrl" target="_blank" class="btn btn-primary">
              &#128179; {{ 'subscription.subscribe' | translate }}
            </a>
          }
        }
        @if (!status?.active && !checkoutUrl) {
          <p class="hint">
            {{ 'subscription.contactAdmin' | translate }}
          </p>
        }
      </div>
    </div>

    <!-- Subscription History Table -->
    <div class="card">
      <div class="card-header">
        <h3>{{ 'subscription.history' | translate }}</h3>
      </div>
      @if (details.length > 0) {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{{ 'subscription.email' | translate }}</th>
                <th>{{ 'subscription.plan' | translate }}</th>
                <th>{{ 'common.status' | translate }}</th>
                <th>{{ 'subscription.startDate' | translate }}</th>
                <th>{{ 'subscription.expiresAt' | translate }}</th>
                <th>{{ 'subscription.transactionId' | translate }}</th>
                <th>{{ 'subscription.lastUpdated' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (sub of details; track sub) {
                <tr>
                  <td>{{ sub.id }}</td>
                  <td>{{ sub.email }}</td>
                  <td>{{ getPlanLabel(sub.planName) }}</td>
                  <td>
                    <span class="status-chip" [class]="'st-' + sub.status">{{
                      getStatusLabel(sub.status)
                    }}</span>
                  </td>
                  <td>
                    {{
                      sub.startDate ? (sub.startDate | localDate: 'mediumDate') : '—'
                    }}
                  </td>
                  <td>
                    {{
                      sub.expiresAt ? (sub.expiresAt | localDate: 'mediumDate') : '—'
                    }}
                  </td>
                  <td class="txn-id">{{ sub.stripeSessionId || '—' }}</td>
                  <td>
                    {{ sub.updatedAt ? (sub.updatedAt | localDate: 'medium') : '—' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      @if (details.length === 0 && !loading) {
        <div class="empty">
          {{ 'subscription.noHistory' | translate }}
        </div>
      }
    </div>

    <!-- Admin Manual Activation (super-admin only) -->
    @if (authService.isSuperAdmin) {
      <div class="card admin-card">
        <div class="card-header">
          <h3>{{ 'subscription.adminOverride' | translate }}</h3>
        </div>
        <p class="card-desc">{{ 'subscription.adminDesc' | translate }}</p>
        <div class="admin-form">
          <div class="form-row">
            <div class="form-group">
              <label>{{ 'subscription.email' | translate }} *</label>
              <input
                type="email"
                [(ngModel)]="manualEmail"
                placeholder="admin@mechanicapp.local"
                required
              />
            </div>
            <div class="form-group">
              <label>{{ 'subscription.planName' | translate }} *</label>
              <select [(ngModel)]="manualPlan" required>
                <option value="free-trial">Free Trial</option>
                <option value="standard">Standard - $49/mo</option>
                <option value="premium">Premium - $79/mo</option>
                <option value="platinum">Platinum - $99/mo</option>
                <option value="golden">Golden (Enterprise)</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ 'subscription.expiryDate' | translate }} *</label>
              <input type="date" [(ngModel)]="manualExpires" required />
            </div>
          </div>
          <button
            class="btn btn-primary"
            (click)="manualActivate()"
            [disabled]="
              activating || !manualEmail || !manualPlan || !manualExpires
            "
          >
            {{
              activating
                ? ('common.saving' | translate)
                : ('subscription.activate' | translate)
            }}
          </button>
          @if (activateMsg) {
            <div class="success-msg">{{ activateMsg }}</div>
          }
          @if (activateError) {
            <div class="error-msg">{{ activateError }}</div>
          }
        </div>
      </div>
    }

    <!-- Stripe Configuration Info (super-admin only) -->
    @if (config && authService.isSuperAdmin) {
      <div class="card">
        <div class="card-header">
          <h3>{{ 'subscription.stripeConfig' | translate }}</h3>
        </div>
        <div class="config-details">
          <div class="detail-row">
            <span class="label">{{
              'subscription.checkoutUrl' | translate
            }}</span>
            <span class="value">
              @if (config.checkoutUrl) {
                <a [href]="config.checkoutUrl" target="_blank">{{
                  config.checkoutUrl
                }}</a>
              }
              @if (!config.checkoutUrl) {
                <em>{{ 'subscription.notConfigured' | translate }}</em>
              }
            </span>
          </div>
          <div class="detail-row">
            <span class="label">{{
              'subscription.webhookUrl' | translate
            }}</span>
            <span class="value webhook-url"
              >/api/subscription/webhook/stripe</span
            >
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .page-header {
        margin-bottom: 24px;
      }
      .page-header h2 {
        margin: 0 0 4px;
        color: #333;
      }
      .subtitle {
        margin: 0;
        color: #888;
        font-size: 0.95rem;
      }

      .card {
        background: #fff;
        border-radius: 10px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
      }
      .card-header {
        margin-bottom: 16px;
      }
      .card-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #333;
      }
      .card-desc {
        color: #888;
        font-size: 0.9rem;
        margin: 0 0 16px;
      }

      /* Status card */
      .status-card {
        border-left: 5px solid #28a745;
      }
      .status-card.demo {
        border-left-color: #007bff;
      }
      .status-card.expired {
        border-left-color: #dc3545;
      }
      .status-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      .status-badge-lg {
        padding: 8px 24px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .badge-active {
        background: #d4edda;
        color: #155724;
      }
      .badge-demo {
        background: #cce5ff;
        color: #004085;
      }
      .badge-expired {
        background: #f8d7da;
        color: #721c24;
      }

      .status-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 24px;
      }
      .detail-row {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .detail-row .label {
        font-size: 0.8rem;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .detail-row .value {
        font-size: 1rem;
        color: #333;
        font-weight: 500;
      }
      .expiring-soon {
        color: #e67e22 !important;
      }
      .days-left {
        font-size: 0.85rem;
        font-weight: 400;
        color: #e67e22;
      }

      .status-text {
        text-transform: capitalize;
      }
      .st-active {
        color: #28a745;
      }
      .st-cancelled {
        color: #dc3545;
      }
      .st-expired,
      .st-inactive {
        color: #dc3545;
      }
      .st-refunded {
        color: #e67e22;
      }
      .st-demo {
        color: #004085;
      }

      .warning-banner {
        margin-top: 16px;
        padding: 10px 16px;
        background: #fff3cd;
        color: #856404;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
      }
      .status-actions {
        margin-top: 16px;
      }
      .hint {
        color: #888;
        font-size: 0.9rem;
      }

      /* Table */
      .table-wrapper {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }
      th {
        text-align: left;
        padding: 10px 12px;
        background: #f8f9fa;
        color: #555;
        font-weight: 600;
        white-space: nowrap;
        border-bottom: 2px solid #dee2e6;
      }
      td {
        padding: 10px 12px;
        border-bottom: 1px solid #f0f0f0;
        color: #333;
      }
      .txn-id {
        font-family: monospace;
        font-size: 0.85rem;
        color: #666;
      }
      .status-chip {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: capitalize;
      }
      .status-chip.st-active {
        background: #d4edda;
        color: #155724;
      }
      .status-chip.st-cancelled {
        background: #f8d7da;
        color: #721c24;
      }
      .status-chip.st-expired,
      .status-chip.st-inactive {
        background: #f8d7da;
        color: #721c24;
      }
      .status-chip.st-refunded {
        background: #fff3cd;
        color: #856404;
      }
      .status-chip.st-demo {
        background: #cce5ff;
        color: #004085;
      }
      .empty {
        text-align: center;
        color: #aaa;
        padding: 24px;
        font-size: 0.95rem;
      }

      /* Admin form */
      .admin-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 16px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .form-group label {
        font-size: 0.85rem;
        color: #555;
        font-weight: 500;
      }
      .form-group input,
      .form-group select {
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-size: 0.95rem;
      }
      .form-group input:focus,
      .form-group select:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
      }
      .success-msg {
        color: #155724;
        background: #d4edda;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.9rem;
      }
      .error-msg {
        color: #721c24;
        background: #f8d7da;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.9rem;
      }

      /* Config */
      .config-details {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .config-details .detail-row {
        flex-direction: row;
        align-items: center;
        gap: 12px;
      }
      .config-details .label {
        min-width: 140px;
      }
      .webhook-url {
        font-family: monospace;
        background: #f1f3f5;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 0.9rem;
      }

      /* Buttons */
      .btn {
        display: inline-block;
        padding: 8px 20px;
        border-radius: 6px;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        border: none;
        text-decoration: none;
        transition: all 0.15s;
      }
      .btn-primary {
        background: #667eea;
        color: #fff;
      }
      .btn-primary:hover {
        background: #5a6fd6;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .btn-outline {
        background: transparent;
        color: #667eea;
        border: 1px solid #667eea;
      }
      .btn-outline:hover {
        background: #667eea;
        color: #fff;
      }
      .btn-sm {
        padding: 5px 14px;
        font-size: 0.85rem;
      }

      @media (max-width: 768px) {
        .status-details {
          grid-template-columns: 1fr;
        }
        .form-row {
          grid-template-columns: 1fr;
        }
        .config-details .detail-row {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class SubscriptionManageComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  status: SubscriptionStatus | null = null;
  details: Subscription[] = [];
  config: SubscriptionConfig | null = null;
  checkoutUrl = '';
  loading = false;

  // Computed
  daysLeft: number | null = null;
  isExpiringSoon = false;

  // Admin activation form
  manualEmail = 'admin@mechanicapp.local';
  manualPlan = 'standard';
  manualExpires = '';
  activating = false;
  activateMsg = '';
  activateError = '';

  constructor(
    private subService: SubscriptionService,
    public authService: AuthService,
    public ts: TranslationService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    // Set default expiry 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    this.manualExpires = d.toISOString().split('T')[0];

    this.refreshAll();
  }

  get statusLabel(): string {
    if (!this.status) return '';
    return this.getStatusLabel(this.status.status);
  }

  refreshAll(): void {
    this.loading = true;

    // 1. Fetch current status
    this.subService
      .checkStatus()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (s) => {
          this.status = s;
          this.computeDaysLeft();
          this.loading = false;
        },
        error: () => (this.loading = false),
      });

    // 2. Fetch subscription history
    this.subService
      .getDetails()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (d) => (this.details = d),
        error: () => (this.details = []),
      });

    // 3. Fetch Stripe config
    this.subService
      .getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (c) => {
          this.config = c;
          this.checkoutUrl = c.checkoutUrl || '';
        },
      });
  }

  private computeDaysLeft(): void {
    if (this.status?.expiresAt) {
      const diff = new Date(this.status.expiresAt).getTime() - Date.now();
      this.daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
      this.isExpiringSoon = this.daysLeft > 0 && this.daysLeft <= 7;
    } else {
      this.daysLeft = null;
      this.isExpiringSoon = false;
    }
  }

  manualActivate(): void {
    if (!this.manualEmail || !this.manualPlan || !this.manualExpires) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.activating = true;
    this.activateMsg = '';
    this.activateError = '';

    this.subService
      .activate({
        email: this.manualEmail || undefined,
        planName: this.manualPlan || undefined,
        expiresAt: this.manualExpires
          ? new Date(this.manualExpires).toISOString()
          : undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.activating = false;
          this.activateMsg = this.ts.t('subscription.activated');
          this.refreshAll();
          setTimeout(() => (this.activateMsg = ''), 4000);
        },
        error: () => {
          this.activating = false;
          this.activateError = this.ts.t('subscription.activateError');
          setTimeout(() => (this.activateError = ''), 4000);
        },
      });
  }

  private readonly planLabels: Record<string, string> = {
    'free-trial': 'Free Trial',
    standard: 'Standard',
    premium: 'Premium',
    platinum: 'Platinum',
    golden: 'Golden (Enterprise)',
  };

  private readonly statusLabels: Record<string, string> = {
    active: 'Active',
    demo: 'Demo',
    inactive: 'Inactive',
    cancelled: 'Cancelled',
    expired: 'Expired',
    refunded: 'Refunded',
    none: 'None',
  };

  getPlanLabel(planName?: string): string {
    if (!planName) return '—';
    return this.planLabels[planName.toLowerCase()] || planName;
  }

  getStatusLabel(status?: string): string {
    if (!status) return '—';
    return this.statusLabels[status.toLowerCase()] || status;
  }
}

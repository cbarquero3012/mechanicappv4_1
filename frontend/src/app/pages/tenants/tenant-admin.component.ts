import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TenantService } from '../../services/tenant.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ToastService } from '../../services/toast.service';
import { Tenant } from '../../models/tenant';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-tenant-admin',
  standalone: true,
  imports: [FormsModule, DatePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tenant-admin">
      <div class="page-header">
        <h2>{{ 'tenants.title' | translate }}</h2>
        <div class="header-actions">
          <button class="btn btn-sm btn-danger" (click)="cleanupDemos()" [disabled]="cleaning">
            {{ cleaning ? '...' : ('tenants.cleanupDemos' | translate) }}
          </button>
          <button class="btn btn-sm btn-primary" (click)="showCreateForm = !showCreateForm">
            + {{ 'tenants.create' | translate }}
          </button>
        </div>
      </div>

      @if (showCreateForm) {
        <div class="create-form card">
          <h4>{{ 'tenants.createNew' | translate }}</h4>
          <div class="form-row">
            <div class="form-group">
              <label>{{ 'common.name' | translate }} *</label>
              <input [(ngModel)]="newTenant.name" name="name" />
            </div>
            <div class="form-group">
              <label>{{ 'subscription.email' | translate }} *</label>
              <input [(ngModel)]="newTenant.email" name="email" type="email" />
            </div>
            <div class="form-group">
              <label>{{ 'subscription.plan' | translate }}</label>
              <select [(ngModel)]="newTenant.planName" name="plan">
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <button class="btn btn-primary" (click)="createTenant()" [disabled]="creating">
              {{ creating ? ('common.saving' | translate) : ('common.save' | translate) }}
            </button>
          </div>
        </div>
      }

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-value">{{ tenants.length }}</span>
          <span class="stat-label">{{ 'tenants.total' | translate }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ activeCount }}</span>
          <span class="stat-label">{{ 'common.active' | translate }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ demoCount }}</span>
          <span class="stat-label">{{ 'tenants.demos' | translate }}</span>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ 'common.name' | translate }}</th>
              <th>Slug</th>
              <th>{{ 'subscription.email' | translate }}</th>
              <th>{{ 'common.status' | translate }}</th>
              <th>{{ 'subscription.plan' | translate }}</th>
              <th>{{ 'tenants.database' | translate }}</th>
              <th>{{ 'tenants.expires' | translate }}</th>
              <th>{{ 'common.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (t of tenants; track t.id) {
              <tr>
                <td>{{ t.id }}</td>
                <td>{{ t.name }}</td>
                <td><code>{{ t.slug }}</code></td>
                <td>{{ t.email }}</td>
                <td>
                  <span class="badge" [class]="'badge-' + t.status">{{ t.status }}</span>
                </td>
                <td>{{ t.planName }}</td>
                <td><code class="db-name">{{ t.databaseName }}</code></td>
                <td>
                  @if (t.isDemo && t.demoExpiresAt) {
                    {{ t.demoExpiresAt | date:'shortDate' }}
                  } @else if (t.subscriptionExpiresAt) {
                    {{ t.subscriptionExpiresAt | date:'shortDate' }}
                  } @else {
                    -
                  }
                </td>
                <td>
                  @if (t.isDemo) {
                    <button class="btn btn-xs btn-primary" (click)="convertTenant(t)">
                      {{ 'tenants.convert' | translate }}
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .tenant-admin { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h2 { margin: 0; }
    .header-actions { display: flex; gap: 0.5rem; }
    .btn { padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
    .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
    .btn-xs { padding: 0.25rem 0.6rem; font-size: 0.75rem; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-danger:hover { background: #b91c1c; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .create-form { margin-bottom: 1.5rem; }
    .card { background: var(--card-bg, #1e293b); border-radius: 8px; padding: 1.25rem; border: 1px solid var(--border-color, rgba(255,255,255,0.1)); }
    .card h4 { margin: 0 0 1rem; }
    .form-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
    .form-group { flex: 1; min-width: 180px; }
    .form-group label { display: block; font-size: 0.8rem; margin-bottom: 0.25rem; opacity: 0.7; }
    .form-group input, .form-group select { width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(255,255,255,0.2)); background: var(--input-bg, rgba(255,255,255,0.05)); color: inherit; }

    .stats-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .stat-card { background: var(--card-bg, #1e293b); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 8px; padding: 1rem 1.5rem; text-align: center; min-width: 120px; }
    .stat-value { display: block; font-size: 1.75rem; font-weight: 700; }
    .stat-label { font-size: 0.8rem; opacity: 0.6; }

    .table-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .data-table th, .data-table td { padding: 0.6rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08)); }
    .data-table th { opacity: 0.7; font-weight: 600; white-space: nowrap; }
    code { background: rgba(0,0,0,0.3); padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.8rem; }
    .db-name { font-size: 0.7rem; }

    .badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .badge-active { background: rgba(34,197,94,0.2); color: #22c55e; }
    .badge-demo { background: rgba(139,92,246,0.2); color: #a78bfa; }
    .badge-suspended { background: rgba(251,191,36,0.2); color: #fbbf24; }
    .badge-cancelled { background: rgba(239,68,68,0.2); color: #ef4444; }
  `,
})
export class TenantAdminComponent implements OnInit {
  private tenantService = inject(TenantService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  tenants: Tenant[] = [];
  showCreateForm = false;
  creating = false;
  cleaning = false;
  newTenant = { name: '', email: '', planName: 'standard' };

  get activeCount() { return this.tenants.filter(t => t.status === 'active').length; }
  get demoCount() { return this.tenants.filter(t => t.isDemo).length; }

  ngOnInit() {
    this.loadTenants();
  }

  loadTenants() {
    this.tenantService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.tenants = data; this.cdr.markForCheck(); },
        error: () => this.toast.show('Failed to load tenants', 'error'),
      });
  }

  createTenant() {
    if (!this.newTenant.name || !this.newTenant.email) return;
    this.creating = true;
    this.tenantService.create(this.newTenant).subscribe({
      next: () => {
        this.toast.show('Tenant created', 'success');
        this.creating = false;
        this.showCreateForm = false;
        this.newTenant = { name: '', email: '', planName: 'standard' };
        this.loadTenants();
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'Failed to create tenant', 'error');
        this.creating = false;
        this.cdr.markForCheck();
      },
    });
  }

  convertTenant(t: Tenant) {
    this.tenantService.convertToPaid(t.id, { planName: 'standard' }).subscribe({
      next: () => {
        this.toast.show('Demo converted to paid', 'success');
        this.loadTenants();
      },
      error: (err) => this.toast.show(err.error?.message || 'Conversion failed', 'error'),
    });
  }

  cleanupDemos() {
    this.cleaning = true;
    this.tenantService.cleanupDemos().subscribe({
      next: (res) => {
        this.toast.show(res.message, 'success');
        this.cleaning = false;
        this.loadTenants();
      },
      error: () => {
        this.toast.show('Cleanup failed', 'error');
        this.cleaning = false;
        this.cdr.markForCheck();
      },
    });
  }
}

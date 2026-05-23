import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  OnInit,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DashboardService,
  DashboardStats,
} from '../../services/dashboard.service';
import { TranslationService } from '../../services/translation.service';
import { AppSettingsService } from '../../services/app-settings.service';
import { AuthService } from '../../services/auth.service';
import { DecimalPipe } from '@angular/common';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, LocalDatePipe, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <h1>{{ 'dashboard.title' | translate }}</h1>
      <p class="welcome">
        {{ 'dashboard.welcome' | translate: { appName: appName() } }}
      </p>

      <!-- KPI Cards -->
      @if (stats) {
        <div class="kpi-grid">
          <div class="kpi-card kpi-blue">
            <div class="kpi-value">{{ stats.totalOrders }}</div>
            <div class="kpi-label">
              {{ 'dashboard.totalOrders' | translate }}
            </div>
          </div>
          <div class="kpi-card kpi-yellow">
            <div class="kpi-value">{{ stats.pendingOrders }}</div>
            <div class="kpi-label">
              {{ 'dashboard.pendingOrders' | translate }}
            </div>
          </div>
          <div class="kpi-card kpi-orange">
            <div class="kpi-value">{{ stats.inProgressOrders }}</div>
            <div class="kpi-label">
              {{ 'dashboard.inProgressOrders' | translate }}
            </div>
          </div>
          <div class="kpi-card kpi-green">
            <div class="kpi-value">{{ stats.completedOrders }}</div>
            <div class="kpi-label">
              {{ 'dashboard.completedOrders' | translate }}
            </div>
          </div>
        </div>

        <div class="stats-row">
          @if (!authService.isMechanic) {
            <div class="stat-box">
              <span class="stat-icon">&#128100;</span>
              <div>
                <strong>{{ stats.customerCount }}</strong
                ><br />{{ 'dashboard.customers' | translate }}
              </div>
            </div>
            <div class="stat-box">
              <span class="stat-icon">&#128663;</span>
              <div>
                <strong>{{ stats.vehicleCount }}</strong
                ><br />{{ 'dashboard.vehicles' | translate }}
              </div>
            </div>
            <div class="stat-box">
              <span class="stat-icon">&#128295;</span>
              <div>
                <strong>{{ stats.mechanicCount }}</strong
                ><br />{{ 'dashboard.mechanics' | translate }}
              </div>
            </div>
          }
          @if (authService.canSeePrices) {
            <div class="stat-box stat-revenue">
              <span class="stat-icon">&#128176;</span>
              <div>
                <strong
                  >{{ stats.totalRevenue | number: '1.2-2' }}
                  {{ stats.currencySymbol }}</strong
                ><br />{{ 'dashboard.totalRevenue' | translate }}
              </div>
            </div>
            <div class="stat-box stat-paid">
              <span class="stat-icon">&#9989;</span>
              <div>
                <strong
                  >{{ stats.paidRevenue | number: '1.2-2' }}
                  {{ stats.currencySymbol }}</strong
                ><br />{{ 'dashboard.paidRevenue' | translate }}
              </div>
            </div>
            <div class="stat-box stat-pending">
              <span class="stat-icon">&#9203;</span>
              <div>
                <strong
                  >{{
                    stats.totalRevenue - stats.paidRevenue | number: '1.2-2'
                  }}
                  {{ stats.currencySymbol }}</strong
                ><br />{{ 'dashboard.pendingRevenue' | translate }}
              </div>
            </div>
          }
        </div>
      }

      <!-- Recent Orders -->
      @if (stats && stats.recentOrders.length > 0) {
        <div class="recent-section">
          <h2>{{ 'dashboard.recentOrders' | translate }}</h2>
          <table class="inventory-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ 'orders.vehicle' | translate }}</th>
                <th>{{ 'orders.mechanic' | translate }}</th>
                <th>{{ 'common.status' | translate }}</th>
                @if (authService.canSeePrices) {
                  <th>{{ 'orders.total' | translate }}</th>
                }
                <th>{{ 'orders.date' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (o of stats.recentOrders; track o.id) {
                <tr>
                  <td>
                    <a [routerLink]="['../repair-orders', o.id]">{{ o.id }}</a>
                  </td>
                  <td>{{ o.carInfo || '-' }}</td>
                  <td>{{ o.mechanicName || '-' }}</td>
                  <td>
                    <span
                      class="status-badge"
                      [class]="'status-' + o.status.toLowerCase()"
                      >{{ o.status }}</span
                    >
                  </td>
                  @if (authService.canSeePrices) {
                    <td>
                      {{ stats.currencySymbol
                      }}{{ o.totalCost | number: '1.2-2' }}
                    </td>
                  }
                  <td>{{ o.orderDate | localDate: 'shortDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Quick Navigation -->
      <h2 class="nav-heading">{{ 'dashboard.quickNav' | translate }}</h2>
      <div class="card-grid">
        @if (authService.hasAccess('car-catalog')) {
          <a routerLink="../cars" class="dashboard-card">
            <div class="card-icon">&#128663;</div>
            <h3>{{ 'dashboard.vehicles' | translate }}</h3>
            <p>{{ 'dashboard.vehicles.desc' | translate }}</p>
          </a>
        }
        @if (authService.hasAccess('repair-orders')) {
          <a routerLink="../repair-orders" class="dashboard-card">
            <div class="card-icon">&#128736;</div>
            <h3>{{ 'dashboard.repairOrders' | translate }}</h3>
            <p>{{ 'dashboard.repairOrders.desc' | translate }}</p>
          </a>
        }
        @if (authService.hasAccess('customers')) {
          <a routerLink="../customers" class="dashboard-card">
            <div class="card-icon">&#128100;</div>
            <h3>{{ 'dashboard.customers' | translate }}</h3>
            <p>{{ 'dashboard.customers.desc' | translate }}</p>
          </a>
        }
        @if (authService.hasAccess('mechanics')) {
          <a routerLink="../mechanics" class="dashboard-card">
            <div class="card-icon">&#128295;</div>
            <h3>{{ 'dashboard.mechanics' | translate }}</h3>
            <p>{{ 'dashboard.mechanics.desc' | translate }}</p>
          </a>
        }
        @if (authService.hasAccess('inventory')) {
          <a routerLink="../inventory" class="dashboard-card">
            <div class="card-icon">&#128230;</div>
            <h3>{{ 'dashboard.inventory' | translate }}</h3>
            <p>{{ 'dashboard.inventory.desc' | translate }}</p>
          </a>
        }
        @if (authService.hasAccess('payments')) {
          <a routerLink="../payments" class="dashboard-card">
            <div class="card-icon">&#128176;</div>
            <h3>{{ 'dashboard.payments' | translate }}</h3>
            <p>{{ 'dashboard.payments.desc' | translate }}</p>
          </a>
        }
        @if (authService.hasAccess('admin')) {
          <a routerLink="../users" class="dashboard-card">
            <div class="card-icon">&#128101;</div>
            <h3>{{ 'dashboard.users' | translate }}</h3>
            <p>{{ 'dashboard.users.desc' | translate }}</p>
          </a>
          <a routerLink="../settings" class="dashboard-card">
            <div class="card-icon">&#9881;</div>
            <h3>{{ 'dashboard.settings' | translate }}</h3>
            <p>{{ 'dashboard.settings.desc' | translate }}</p>
          </a>
        }
      </div>
    </div>
  `,
  styles: [
    '.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; } .kpi-card { padding: 20px; border-radius: 10px; text-align: center; color: #fff; } .kpi-value { font-size: 2.2rem; font-weight: 700; } .kpi-label { font-size: 0.85rem; opacity: 0.9; margin-top: 4px; } .kpi-blue { background: linear-gradient(135deg, #0d6efd, #3d8bfd); } .kpi-yellow { background: linear-gradient(135deg, #ffc107, #ffca2c); color: #333; } .kpi-orange { background: linear-gradient(135deg, #fd7e14, #ff922b); } .kpi-green { background: linear-gradient(135deg, #198754, #20c997); } .stats-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; } .stat-box { display: flex; align-items: center; gap: 10px; background: #f8f9fa; padding: 14px 18px; border-radius: 8px; flex: 1; min-width: 160px; } .stat-icon { font-size: 1.6rem; } .stat-revenue { background: #e8f5e9; } .stat-paid { background: #e3f2fd; } .stat-pending { background: #fff3e0; } .recent-section { margin-bottom: 24px; } .recent-section h2 { font-size: 1.1rem; margin-bottom: 8px; } .nav-heading { font-size: 1.1rem; margin-bottom: 12px; } .status-badge { padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; } .status-pending { background: #fff3cd; color: #856404; } .status-inprogress { background: #cfe2ff; color: #084298; } .status-completed { background: #d1e7dd; color: #0f5132; } .status-cancelled { background: #f8d7da; color: #842029; } @media (max-width: 768px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }',
  ],
})
export class DashboardComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  readonly appName = computed(() => this.appSettings.settings().appName);
  stats: DashboardStats | null = null;

  constructor(
    private dashboardService: DashboardService,
    public ts: TranslationService,
    private appSettings: AppSettingsService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.dashboardService
      .getStats()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (data) => (this.stats = data),
      });
  }
}

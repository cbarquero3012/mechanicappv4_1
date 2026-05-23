import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { DetailCarService } from '../../services/detail-car.service';
import { Customer } from '../../models/customer';
import { DetailCar } from '../../models/detail-car';
import { TranslationService } from '../../services/translation.service';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-customer-detail',
  imports: [FormsModule, RouterModule, LocalDatePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (customer) {
      <div class="module-page">
        <div class="page-header">
          <h1>&#128100; {{ customer.firstName }} {{ customer.lastName }}</h1>
        </div>
        <div class="page-actions">
          <a [routerLink]="'/' + slug + '/customers'" class="btn btn-outline"
            >&larr; {{ 'customerDetail.back' | translate }}</a
          >
        </div>
        <div class="customer-info-card">
          <div class="info-row">
            <strong>{{ 'customers.email' | translate }}:</strong>
            {{ customer.email || '-' }}
          </div>
          <div class="info-row">
            <strong>{{ 'customers.phone' | translate }}:</strong>
            {{ customer.phoneNumber }}
          </div>
          <div class="info-row">
            <strong>{{ 'customers.address' | translate }}:</strong>
            {{ customer.address || '-' }}
          </div>
          <div class="info-row">
            <strong>{{ 'customers.since' | translate }}:</strong>
            {{ customer.createdAt | localDate: 'mediumDate' }}
          </div>
        </div>
        <h2 class="section-title">
          &#128663; {{ 'customerDetail.vehicles' | translate }} ({{
            vehicles.length
          }})
        </h2>
        @if (vehicles.length > 0) {
          <div class="inventory-table-wrapper">
            <table class="inventory-table">
              <thead>
                <tr>
                  <th>
                    {{ 'vehicles.brand' | translate }} /
                    {{ 'vehicles.model' | translate }}
                  </th>
                  <th>{{ 'vehicles.year' | translate }}</th>
                  <th>{{ 'vehicles.vin' | translate }}</th>
                  <th>{{ 'vehicles.fuel' | translate }}</th>
                  <th>{{ 'vehicles.type' | translate }}</th>
                  <th>{{ 'vehicles.transmission' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (v of vehicles; track v) {
                  <tr>
                    <td>
                      <strong>{{ v.brand || '?' }} {{ v.model || '?' }}</strong>
                    </td>
                    <td>{{ v.year }}</td>
                    <td>{{ v.vin }}</td>
                    <td>{{ v.fuel }}</td>
                    <td>{{ v.typeCar }}</td>
                    <td>{{ v.transmissionType }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        @if (vehicles.length === 0 && !loading) {
          <div class="empty-state">
            <p>{{ 'customerDetail.noVehicles' | translate }}</p>
          </div>
        }
        @if (loading) {
          <div class="loading">Loading...</div>
        }
      </div>
    }
  `,
  styles: [
    '.customer-info-card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } .info-row { font-size: 0.95rem; } .section-title { margin: 24px 0 12px; font-size: 1.1rem; }',
  ],
})
export class CustomerDetailComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  customer!: Customer;
  vehicles: DetailCar[] = [];
  loading = true;

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private detailCarService: DetailCarService,
    public ts: TranslationService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      const slug = localStorage.getItem('tenant_slug');
      this.router.navigate([slug ? `/${slug}/customers` : '/landing']);
      return;
    }

    this.customerService
      .getCustomer(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((c) => (this.customer = c));
    this.detailCarService
      .getByCustomer(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (v) => {
          this.vehicles = v;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }
}

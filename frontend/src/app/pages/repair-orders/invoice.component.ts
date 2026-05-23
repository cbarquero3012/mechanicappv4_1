import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { RepairOrderService } from '../../services/repair-order.service';
import { RepairOrder } from '../../models/repair-order';
import { RepairOrderServiceItem } from '../../models/repair-order-service';
import { RepairOrderPartItem } from '../../models/repair-order-part';
import { RepairOrderProductItem } from '../../models/repair-order-product';
import { TranslationService } from '../../services/translation.service';
import { CurrencyService } from '../../services/currency.service';
import { AppSettingsService } from '../../services/app-settings.service';
import { DecimalPipe } from '@angular/common';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-invoice',
  imports: [RouterModule, LocalDatePipe, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="invoice-actions no-print">
      @if (order) {
        <a
          [routerLink]="'/' + slug + '/repair-orders/' + order.id"
          class="btn btn-outline"
          >&larr; {{ 'invoice.back' | translate }}</a
        >
      }
      <button class="btn btn-primary" (click)="printInvoice()">
        &#128424; {{ 'invoice.print' | translate }}
      </button>
    </div>

    @if (order) {
      <div class="invoice-page" id="invoicePrint">
        <div class="invoice-header">
          <div class="company-info">
            <h1>{{ appName }}</h1>
            <p>Mechanic Auto Shop</p>
          </div>
          <div class="invoice-meta">
            <h2>{{ 'invoice.title' | translate }}</h2>
            <p>
              <strong>{{ 'invoice.orderNum' | translate }}</strong>
              {{ order.id }}
            </p>
            <p>
              <strong>{{ 'invoice.date' | translate }}:</strong>
              {{ order.orderDate | localDate: 'mediumDate' }}
            </p>
          </div>
        </div>
        <hr />
        <div class="invoice-details">
          <div>
            <strong>{{ 'invoice.vehicle' | translate }}:</strong>
            {{ order.carInfo || 'N/A' }}
          </div>
          <div>
            <strong>{{ 'invoice.mechanic' | translate }}:</strong>
            {{ order.mechanicName || 'N/A' }}
          </div>
          <div>
            <strong>{{ 'common.status' | translate }}:</strong>
            {{ order.status }}
          </div>
        </div>
        <!-- Services table -->
        <h3>{{ 'invoice.services' | translate }}</h3>
        @if (services.length > 0) {
          <table class="invoice-table">
            <thead>
              <tr>
                <th>{{ 'orderDetail.serviceName' | translate }}</th>
                <th>{{ 'common.qty' | translate }}</th>
                <th>{{ 'common.price' | translate }}</th>
                <th>{{ 'orderDetail.subtotal' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (s of services; track s) {
                <tr>
                  <td>{{ s.serviceName }}</td>
                  <td>{{ s.quantity }}</td>
                  <td>
                    {{ s.currencySymbol || currSymbol
                    }}{{ s.unitPrice | number: '1.2-2' }}
                  </td>
                  <td>
                    {{ s.currencySymbol || currSymbol
                    }}{{ s.quantity * s.unitPrice | number: '1.2-2' }}
                  </td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3"><strong>Subtotal</strong></td>
                <td>
                  <strong
                    >{{ currSymbol
                    }}{{ servicesTotal | number: '1.2-2' }}</strong
                  >
                </td>
              </tr>
            </tfoot>
          </table>
        }
        @if (services.length === 0) {
          <p class="no-items">
            {{ 'invoice.noItems' | translate }}
          </p>
        }
        <!-- Parts table -->
        <h3>{{ 'invoice.parts' | translate }}</h3>
        @if (parts.length > 0) {
          <table class="invoice-table">
            <thead>
              <tr>
                <th>{{ 'orderDetail.partName' | translate }}</th>
                <th>{{ 'common.qty' | translate }}</th>
                <th>{{ 'common.price' | translate }}</th>
                <th>{{ 'orderDetail.subtotal' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (p of parts; track p) {
                <tr>
                  <td>{{ p.partName }}</td>
                  <td>{{ p.quantity }}</td>
                  <td>
                    {{ p.currencySymbol || currSymbol
                    }}{{ p.unitPrice | number: '1.2-2' }}
                  </td>
                  <td>
                    {{ p.currencySymbol || currSymbol
                    }}{{ p.quantity * p.unitPrice | number: '1.2-2' }}
                  </td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3"><strong>Subtotal</strong></td>
                <td>
                  <strong
                    >{{ currSymbol }}{{ partsTotal | number: '1.2-2' }}</strong
                  >
                </td>
              </tr>
            </tfoot>
          </table>
        }
        @if (parts.length === 0) {
          <p class="no-items">
            {{ 'invoice.noItems' | translate }}
          </p>
        }
        <!-- Products table -->
        <h3>{{ 'invoice.products' | translate }}</h3>
        @if (products.length > 0) {
          <table class="invoice-table">
            <thead>
              <tr>
                <th>{{ 'orderDetail.productName' | translate }}</th>
                <th>{{ 'common.qty' | translate }}</th>
                <th>{{ 'common.price' | translate }}</th>
                <th>{{ 'orderDetail.subtotal' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (pr of products; track pr) {
                <tr>
                  <td>{{ pr.productName }}</td>
                  <td>{{ pr.quantity }}</td>
                  <td>
                    {{ pr.currencySymbol || currSymbol
                    }}{{ pr.unitPrice | number: '1.2-2' }}
                  </td>
                  <td>
                    {{ pr.currencySymbol || currSymbol
                    }}{{ pr.quantity * pr.unitPrice | number: '1.2-2' }}
                  </td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3"><strong>Subtotal</strong></td>
                <td>
                  <strong
                    >{{ currSymbol
                    }}{{ productsTotal | number: '1.2-2' }}</strong
                  >
                </td>
              </tr>
            </tfoot>
          </table>
        }
        @if (products.length === 0) {
          <p class="no-items">
            {{ 'invoice.noItems' | translate }}
          </p>
        }
        <div class="grand-total">
          <strong
            >{{ 'invoice.grandTotal' | translate }}:
            {{ order.currencySymbol || currSymbol
            }}{{ order.totalCost | number: '1.2-2' }}</strong
          >
        </div>
        <div class="invoice-footer">
          <p>Thank you for your business!</p>
        </div>
      </div>
    }
  `,
  styles: [
    '.invoice-actions { display: flex; gap: 12px; margin-bottom: 20px; } .invoice-page { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border: 1px solid #dee2e6; border-radius: 8px; color: #333; } .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; } .company-info h1 { margin: 0; font-size: 1.8rem; color: #0d6efd; } .company-info p { margin: 4px 0 0; opacity: 0.7; } .invoice-meta { text-align: right; } .invoice-meta h2 { margin: 0 0 8px; font-size: 1.4rem; text-transform: uppercase; letter-spacing: 2px; } .invoice-meta p { margin: 2px 0; font-size: 0.9rem; } .invoice-details { display: flex; gap: 24px; flex-wrap: wrap; margin: 16px 0; } .invoice-details div { font-size: 0.95rem; } h3 { margin: 20px 0 8px; font-size: 1rem; border-bottom: 1px solid #eee; padding-bottom: 4px; } .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; } .invoice-table th, .invoice-table td { padding: 8px 12px; border: 1px solid #dee2e6; text-align: left; font-size: 0.9rem; } .invoice-table th { background: #f8f9fa; } .invoice-table tfoot td { border-top: 2px solid #333; } .no-items { font-style: italic; opacity: 0.6; } .grand-total { text-align: right; font-size: 1.3rem; margin: 20px 0; padding: 12px; background: #0d6efd; color: #fff; border-radius: 4px; } .invoice-footer { text-align: center; margin-top: 30px; opacity: 0.5; font-size: 0.85rem; } @media print { .no-print { display: none !important; } .invoice-page { border: none; box-shadow: none; padding: 0; } }',
  ],
})
export class InvoiceComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  order!: RepairOrder;
  services: RepairOrderServiceItem[] = [];
  parts: RepairOrderPartItem[] = [];
  products: RepairOrderProductItem[] = [];
  appName = '';
  currSymbol = '₡';

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  get servicesTotal(): number {
    return this.services.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);
  }

  get partsTotal(): number {
    return this.parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  }

  get productsTotal(): number {
    return this.products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private repairOrderService: RepairOrderService,
    private currencyService: CurrencyService,
    private appSettings: AppSettingsService,
    public ts: TranslationService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      const slug = localStorage.getItem('tenant_slug');
      this.router.navigate([slug ? `/${slug}/repair-orders` : '/landing']);
      return;
    }
    this.repairOrderService
      .getOrder(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((o) => (this.order = o));
    this.repairOrderService
      .getOrderServices(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((s) => (this.services = s));
    this.repairOrderService
      .getOrderParts(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((p) => (this.parts = p));
    this.repairOrderService
      .getOrderProducts(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((p) => (this.products = p));
    this.currencyService
      .getDefaultSymbol()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((s) => (this.currSymbol = s));
    this.appName = this.appSettings.current.appName;
  }

  printInvoice() {
    window.print();
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PaymentService } from '../../services/payment.service';
import { RepairOrderService } from '../../services/repair-order.service';
import { CurrencyService } from '../../services/currency.service';
import { Payment } from '../../models/payment';
import { RepairOrder } from '../../models/repair-order';
import { RepairOrderServiceItem } from '../../models/repair-order-service';
import { RepairOrderPartItem } from '../../models/repair-order-part';
import { TranslationService } from '../../services/translation.service';
import { AppSettingsService } from '../../services/app-settings.service';
import { DecimalPipe } from '@angular/common';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

interface OrderBlock {
  order: RepairOrder;
  services: RepairOrderServiceItem[];
  parts: RepairOrderPartItem[];
  servicesTotal: number;
  partsTotal: number;
}

@Component({
  selector: 'app-payment-invoice',
  imports: [RouterModule, LocalDatePipe, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="invoice-actions no-print">
      <a [routerLink]="'/' + slug + '/payments'" class="btn btn-outline"
        >&larr; {{ 'invoice.backToPayments' | translate }}</a
      >
      @if (payment) {
        <button class="btn btn-primary" (click)="printInvoice()">
          &#128424; {{ 'invoice.print' | translate }}
        </button>
      }
    </div>

    @if (loading) {
      <div class="loading" style="text-align:center;padding:40px">
        Loading...
      </div>
    }
    @if (errorMsg) {
      <div class="error-message">{{ errorMsg }}</div>
    }

    @if (payment && !loading) {
      <div class="invoice-page" id="invoicePrint">
        <div class="invoice-header">
          <div class="company-info">
            <h1>{{ appName }}</h1>
            <p>Mechanic Auto Shop</p>
          </div>
          <div class="invoice-meta">
            <h2>{{ 'invoice.title' | translate }}</h2>
            <p>
              <strong>{{ 'invoice.paymentNum' | translate }}</strong>
              {{ payment.id }}
            </p>
            <p>
              <strong>{{ 'invoice.date' | translate }}:</strong>
              {{ payment.paymentDate | localDate: 'mediumDate' }}
            </p>
            <p>
              <strong>{{ 'payments.methodLabel' | translate }}:</strong>
              {{ payment.paymentMethod }}
            </p>
            @if (payment.referenceNumber) {
              <p>
                <strong>{{ 'payments.reference' | translate }}:</strong>
                {{ payment.referenceNumber }}
              </p>
            }
          </div>
        </div>
        <hr />
        <div class="invoice-details">
          <div>
            <strong>{{ 'invoice.customer' | translate }}:</strong>
            {{ payment.customerName || 'N/A' }}
          </div>
          <div>
            <strong>{{ 'invoice.orders' | translate }}:</strong>
            @for (ob of orderBlocks; track ob; let last = $last) {
              <span>
                #{{ ob.order.id }}
                @if (!last) {
                  <span>, </span>
                }
              </span>
            }
          </div>
        </div>
        <!-- Per-order sections -->
        @for (ob of orderBlocks; track ob; let i = $index) {
          <div class="order-section">
            <div class="order-section-header">
              <h3>
                {{ 'invoice.orderNum' | translate }}{{ ob.order.id }}
                @if (ob.order.carInfo) {
                  <span class="vehicle-tag"> — {{ ob.order.carInfo }} </span>
                }
              </h3>
              @if (ob.order.mechanicName) {
                <span class="mechanic-tag">
                  {{ 'invoice.mechanic' | translate }}:
                  {{ ob.order.mechanicName }}
                </span>
              }
            </div>
            <!-- Services -->
            <h4>{{ 'invoice.services' | translate }}</h4>
            @if (ob.services.length > 0) {
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
                  @for (s of ob.services; track s) {
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
                        }}{{ ob.servicesTotal | number: '1.2-2' }}</strong
                      >
                    </td>
                  </tr>
                </tfoot>
              </table>
            }
            @if (ob.services.length === 0) {
              <p class="no-items">
                {{ 'invoice.noItems' | translate }}
              </p>
            }
            <!-- Parts -->
            <h4>{{ 'invoice.parts' | translate }}</h4>
            @if (ob.parts.length > 0) {
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
                  @for (p of ob.parts; track p) {
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
                        >{{ currSymbol
                        }}{{ ob.partsTotal | number: '1.2-2' }}</strong
                      >
                    </td>
                  </tr>
                </tfoot>
              </table>
            }
            @if (ob.parts.length === 0) {
              <p class="no-items">
                {{ 'invoice.noItems' | translate }}
              </p>
            }
            <div class="order-total">
              <strong
                >{{ 'invoice.orderSubtotal' | translate }}:
                {{ ob.order.currencySymbol || currSymbol
                }}{{ ob.order.totalCost | number: '1.2-2' }}</strong
              >
            </div>
          </div>
        }
        <!-- Grand totals -->
        <div class="grand-total-section">
          <div class="grand-total-row">
            <span>{{ 'invoice.combinedOrdersTotal' | translate }}</span>
            <strong
              >{{ currSymbol }}{{ ordersGrandTotal | number: '1.2-2' }}</strong
            >
          </div>
          <div class="grand-total">
            <strong
              >{{ 'invoice.amountPaid' | translate }}:
              {{ payment.currencySymbol || currSymbol
              }}{{ payment.amount | number: '1.2-2' }}</strong
            >
            @if (payment.originalAmount) {
              <span
                style="display:block;font-size:0.85em;margin-top:4px;opacity:0.85"
              >
                {{ 'payments.originalAmount' | translate }}:
                {{ payment.originalCurrencySymbol || '?'
                }}{{ payment.originalAmount | number: '1.2-2' }}
              </span>
            }
          </div>
        </div>
        <div class="invoice-footer">
          @if (payment.notes) {
            <p style="font-style:italic;margin-bottom:8px">
              {{ payment.notes }}
            </p>
          }
          <p>Thank you for your business!</p>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .invoice-actions {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
      }
      .invoice-page {
        max-width: 800px;
        margin: 0 auto;
        background: #fff;
        padding: 40px;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        color: #333;
      }
      .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .company-info h1 {
        margin: 0;
        font-size: 1.8rem;
        color: #0d6efd;
      }
      .company-info p {
        margin: 4px 0 0;
        opacity: 0.7;
      }
      .invoice-meta {
        text-align: right;
      }
      .invoice-meta h2 {
        margin: 0 0 8px;
        font-size: 1.4rem;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      .invoice-meta p {
        margin: 2px 0;
        font-size: 0.9rem;
      }
      .invoice-details {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
        margin: 16px 0;
      }
      .invoice-details div {
        font-size: 0.95rem;
      }
      .order-section {
        margin: 24px 0;
        padding: 16px;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        background: #fafbfc;
      }
      .order-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }
      .order-section-header h3 {
        margin: 0;
        font-size: 1.05rem;
      }
      .vehicle-tag {
        color: #555;
        font-weight: normal;
      }
      .mechanic-tag {
        font-size: 0.85rem;
        color: #666;
      }
      h4 {
        margin: 14px 0 6px;
        font-size: 0.9rem;
        border-bottom: 1px solid #eee;
        padding-bottom: 3px;
      }
      .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
      }
      .invoice-table th,
      .invoice-table td {
        padding: 6px 10px;
        border: 1px solid #dee2e6;
        text-align: left;
        font-size: 0.85rem;
      }
      .invoice-table th {
        background: #f1f3f5;
      }
      .invoice-table tfoot td {
        border-top: 2px solid #333;
      }
      .no-items {
        font-style: italic;
        opacity: 0.6;
        font-size: 0.85rem;
      }
      .order-total {
        text-align: right;
        margin-top: 8px;
        font-size: 1rem;
      }
      .grand-total-section {
        margin-top: 20px;
        border-top: 2px solid #333;
        padding-top: 12px;
      }
      .grand-total-row {
        display: flex;
        justify-content: space-between;
        font-size: 1rem;
        margin-bottom: 8px;
      }
      .grand-total {
        text-align: right;
        font-size: 1.3rem;
        padding: 12px;
        background: #0d6efd;
        color: #fff;
        border-radius: 4px;
      }
      .invoice-footer {
        text-align: center;
        margin-top: 30px;
        opacity: 0.5;
        font-size: 0.85rem;
      }
      @media print {
        .no-print {
          display: none !important;
        }
        .invoice-page {
          border: none;
          box-shadow: none;
          padding: 0;
        }
        .order-section {
          break-inside: avoid;
        }
      }
    `,
  ],
})
export class PaymentInvoiceComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  payment!: Payment;
  orderBlocks: OrderBlock[] = [];
  appName = '';
  currSymbol = '₡';
  loading = true;
  errorMsg = '';

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  get ordersGrandTotal(): number {
    return this.orderBlocks.reduce((s, ob) => s + ob.order.totalCost, 0);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private repairOrderService: RepairOrderService,
    private currencyService: CurrencyService,
    private appSettings: AppSettingsService,
    public ts: TranslationService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      const slug = localStorage.getItem('tenant_slug');
      this.router.navigate([slug ? `/${slug}/payments` : '/landing']);
      return;
    }

    this.currencyService
      .getDefaultSymbol()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((s) => (this.currSymbol = s));
    this.appName = this.appSettings.current.appName;

    this.paymentService
      .getPayment(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (p) => {
          if (!p || !p.id) {
            this.errorMsg = 'Payment not found';
            this.loading = false;
            return;
          }
          this.payment = p;
          const orderIds = (p.orderInfo || '')
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => n > 0);

          if (orderIds.length === 0) {
            this.loading = false;
            return;
          }

          // Fetch all orders + their services/parts in parallel
          const obs = orderIds.map((oid) =>
            forkJoin({
              order: this.repairOrderService.getOrder(oid),
              services: this.repairOrderService.getOrderServices(oid),
              parts: this.repairOrderService.getOrderParts(oid),
            }),
          );

          forkJoin(obs)
            .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
            .subscribe({
              next: (results) => {
                this.orderBlocks = results.map((r) => ({
                  order: r.order,
                  services: r.services,
                  parts: r.parts,
                  servicesTotal: r.services.reduce(
                    (s, sv) => s + sv.quantity * sv.unitPrice,
                    0,
                  ),
                  partsTotal: r.parts.reduce(
                    (s, pt) => s + pt.quantity * pt.unitPrice,
                    0,
                  ),
                }));
                this.loading = false;
              },
              error: () => {
                this.errorMsg = 'Error loading order details';
                this.loading = false;
              },
            });
        },
        error: () => {
          this.errorMsg = 'Error loading payment';
          this.loading = false;
        },
      });
  }

  printInvoice() {
    window.print();
  }
}

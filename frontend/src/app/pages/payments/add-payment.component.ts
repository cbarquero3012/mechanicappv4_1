import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgForm } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';
import { RepairOrderService } from '../../services/repair-order.service';
import { CustomerService } from '../../services/customer.service';
import { Payment } from '../../models/payment';
import { RepairOrder } from '../../models/repair-order';
import { Customer } from '../../models/customer';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';
import { CurrencyService } from '../../services/currency.service';
import { Currency } from '../../models/currency';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-add-payment',
  imports: [FormsModule, RouterModule, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>+ {{ 'payments.addTitle' | translate }}</h1>
        <p>{{ 'payments.addSubtitle' | translate }}</p>
      </div>
      <div class="page-actions">
        <a [routerLink]="'/' + slug + '/payments'" class="btn btn-outline"
          >&larr; {{ 'payments.viewPayments' | translate }}</a
        >
      </div>

      <form
        (ngSubmit)="onSubmit()"
        #paymentForm="ngForm"
        class="inventory-form"
      >
        @if (errorMsg) {
          <div class="error-message">{{ errorMsg }}</div>
        }
        <!-- ORDER SELECTION (multi-select checkboxes) -->
        <div class="form-row">
          <div class="form-group full-width">
            <label>{{ 'payments.repairOrder' | translate }} *</label>
            <div class="order-select-list">
              @for (o of orders; track o) {
                <div
                  class="order-select-item"
                  [class.selected]="isOrderSelected(o.id!)"
                  (click)="toggleOrder(o.id!)"
                >
                  <input
                    type="checkbox"
                    [checked]="isOrderSelected(o.id!)"
                    (click)="$event.stopPropagation()"
                    (change)="toggleOrder(o.id!)"
                  />
                  <span class="order-badge">#{{ o.id }}</span>
                  <span class="order-car">{{ o.carInfo || 'N/A' }}</span>
                  <span class="order-cost">
                    {{ o.currencySymbol || currSymbol
                    }}{{ o.totalCost | number: '1.2-2' }}
                  </span>
                  <span class="order-remaining">
                    ({{ 'payments.remaining' | translate }}:
                    {{ o.currencySymbol || currSymbol
                    }}{{ getRemaining(o) | number: '1.2-2' }})
                  </span>
                </div>
              }
              @if (orders.length === 0) {
                <div class="field-hint" style="padding: 8px;">
                  {{ 'payments.noOrders' | translate }}
                  <a [routerLink]="'/' + slug + '/repair-orders/add'">{{
                    'payments.addOrderFirst' | translate
                  }}</a
                  >.
                </div>
              }
            </div>
          </div>
        </div>

        <!-- SELECTED ORDERS SUMMARY -->
        @if (selectedOrderIds.length > 0) {
          <div class="form-row">
            <div class="form-group full-width">
              <div class="selected-orders-summary">
                <strong>{{ 'payments.selectedOrders' | translate }}:</strong>
                {{ selectedOrderIds.length }}
                &mdash;
                <strong>{{ 'payments.combinedTotal' | translate }}:</strong>
                {{ currSymbol }}{{ combinedTotal | number: '1.2-2' }}
                &mdash;
                <strong>{{ 'payments.combinedRemaining' | translate }}:</strong>
                {{ currSymbol }}{{ combinedRemaining | number: '1.2-2' }}
              </div>
            </div>
          </div>
        }

        @if (orders.length > 0) {
          <div class="form-row">
            <div class="form-group">
              <label for="customerId">{{
                'payments.customer' | translate
              }}</label>
              <select
                id="customerId"
                [(ngModel)]="payment.customerId"
                name="customerId"
              >
                <option [ngValue]="undefined">
                  -- {{ 'payments.selectCustomer' | translate }} --
                </option>
                @for (c of customers; track c) {
                  <option [ngValue]="c.id">
                    {{ c.firstName }} {{ c.lastName }}
                  </option>
                }
              </select>
            </div>
            <div class="form-group">
              <label for="amount"
                >{{ 'payments.amount' | translate }} ({{
                  selectedCurrencySymbol
                }}) *</label
              >
              <input
                id="amount"
                type="number"
                [(ngModel)]="payment.amount"
                name="amount"
                step="0.01"
                min="0.01"
                required
              />
              @if (isConversion && payment.amount > 0) {
                <small class="field-hint" style="color:#0069d9;font-weight:500">
                  {{ 'payments.conversionPreview' | translate }}: {{ currSymbol
                  }}{{ convertedAmountPreview | number: '1.2-2' }} ({{
                    'payments.exchangeRate' | translate
                  }}: {{ selectedExchangeRate | number: '1.2-6' }})
                </small>
              }
            </div>
          </div>
        }

        <div class="form-row">
          <div class="form-group">
            <label for="paymentMethod"
              >{{ 'payments.methodLabel' | translate }} *</label
            >
            <select
              id="paymentMethod"
              [(ngModel)]="payment.paymentMethod"
              name="paymentMethod"
              required
            >
              <option value="Cash">
                {{ 'payments.method.cash' | translate }}
              </option>
              <option value="Credit Card">
                {{ 'payments.method.creditCard' | translate }}
              </option>
              <option value="Debit Card">
                {{ 'payments.method.debitCard' | translate }}
              </option>
              <option value="Transfer">
                {{ 'payments.method.transfer' | translate }}
              </option>
              <option value="Check">
                {{ 'payments.method.check' | translate }}
              </option>
              <option value="Other">
                {{ 'payments.method.other' | translate }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="referenceNumber">{{
              'payments.reference' | translate
            }}</label>
            <input
              id="referenceNumber"
              type="text"
              [(ngModel)]="payment.referenceNumber"
              name="referenceNumber"
              [placeholder]="'payments.referencePlaceholder' | translate"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="currency">{{ 'common.currency' | translate }}</label>
            <select
              id="currency"
              [(ngModel)]="payment.currencyId"
              name="currencyId"
              (ngModelChange)="onCurrencyChange()"
            >
              <option [ngValue]="undefined">
                -- {{ 'common.selectCurrency' | translate }} --
              </option>
              @for (c of currencies; track c) {
                <option [ngValue]="c.id">
                  {{ c.symbol }} - {{ c.name }} ({{ c.code }})
                </option>
              }
            </select>
          </div>
          <div class="form-group">
            <label for="notes">{{ 'payments.notes' | translate }}</label>
            <textarea
              id="notes"
              [(ngModel)]="payment.notes"
              name="notes"
              rows="3"
              [placeholder]="'payments.notesPlaceholder' | translate"
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="
            !paymentForm.valid ||
            selectedOrderIds.length === 0 ||
            payment.amount <= 0
          "
        >
          {{ 'payments.register' | translate }}
        </button>
      </form>

      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }
    </div>
  `,
  styles: [
    `
      .order-select-list {
        max-height: 240px;
        overflow-y: auto;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: var(--card-bg, #fff);
      }
      .order-select-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background 0.15s;
        font-size: 0.9rem;
      }
      .order-select-item:last-child {
        border-bottom: none;
      }
      .order-select-item:hover {
        background: rgba(13, 110, 253, 0.05);
      }
      .order-select-item.selected {
        background: rgba(13, 110, 253, 0.1);
        border-left: 3px solid #0d6efd;
      }
      .order-select-item input[type='checkbox'] {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
      }
      .order-badge {
        font-weight: 600;
        color: #0d6efd;
        min-width: 35px;
      }
      .order-car {
        flex: 1;
      }
      .order-cost {
        font-weight: 600;
        white-space: nowrap;
      }
      .order-remaining {
        font-size: 0.82em;
        color: #666;
        white-space: nowrap;
      }
      .selected-orders-summary {
        background: var(--card-bg, #f0f7ff);
        border: 1px solid #b6d4fe;
        border-radius: 6px;
        padding: 10px 14px;
        font-size: 0.92rem;
        color: #0d6efd;
      }
    `,
  ],
})
export class AddPaymentComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('paymentForm') paymentForm!: NgForm;
  payment: Payment = { amount: 0, paymentMethod: 'Cash' };
  orders: RepairOrder[] = [];
  customers: Customer[] = [];
  selectedOrderIds: number[] = [];
  successMsg = '';
  errorMsg = '';
  currencies: Currency[] = [];
  currSymbol = '₡';

  get selectedCurrencySymbol(): string {
    if (this.payment.currencyId) {
      const c = this.currencies.find(
        (cur) => cur.id === this.payment.currencyId,
      );
      if (c) return c.symbol;
    }
    return this.currSymbol;
  }

  get combinedTotal(): number {
    return this.selectedOrders.reduce((s, o) => s + o.totalCost, 0);
  }

  get combinedRemaining(): number {
    return this.selectedOrders.reduce((s, o) => s + this.getRemaining(o), 0);
  }

  get selectedOrders(): RepairOrder[] {
    return this.orders.filter((o) => this.selectedOrderIds.includes(o.id!));
  }

  get isConversion(): boolean {
    const c = this.currencies.find((cur) => cur.id === this.payment.currencyId);
    return !!c && !c.isDefault;
  }

  get selectedExchangeRate(): number {
    const c = this.currencies.find((cur) => cur.id === this.payment.currencyId);
    return c?.exchangeRate ?? 1;
  }

  get convertedAmountPreview(): number {
    return this.payment.amount * this.selectedExchangeRate;
  }

  constructor(
    private paymentService: PaymentService,
    private orderService: RepairOrderService,
    private customerService: CustomerService,
    private currencyService: CurrencyService,
    public ts: TranslationService,
    private toast: ToastService,
    private router: Router,
  ) {}

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  ngOnInit(): void {
    this.orderService
      .getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((data) => {
        this.orders = data.filter(
          (o) => o.status === 'Completed' && (o.totalPaid ?? 0) < o.totalCost,
        );
      });
    this.customerService
      .getCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((data) => (this.customers = data));
    this.currencyService
      .getActiveCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((list) => {
        this.currencies = list;
        const def = list.find((c) => c.isDefault);
        if (def) {
          this.currSymbol = def.symbol;
          this.payment.currencyId = def.id;
        }
      });
  }

  isOrderSelected(orderId: number): boolean {
    return this.selectedOrderIds.includes(orderId);
  }

  toggleOrder(orderId: number): void {
    const idx = this.selectedOrderIds.indexOf(orderId);
    if (idx >= 0) {
      this.selectedOrderIds.splice(idx, 1);
    } else {
      this.selectedOrderIds.push(orderId);
    }
    this.payment.amount = this.combinedRemaining;
  }

  getRemaining(order: RepairOrder): number {
    return Math.max(0, order.totalCost - (order.totalPaid ?? 0));
  }

  onCurrencyChange(): void {}

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Pending: 'status.pending',
      'In Progress': 'status.inProgress',
      Completed: 'status.completed',
      Cancelled: 'status.cancelled',
    };
    return this.ts.t(map[status] || status);
  }

  onSubmit(): void {
    if (this.paymentForm?.invalid || this.selectedOrderIds.length === 0) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.errorMsg = '';
    this.payment.repairOrderIds = this.selectedOrderIds;
    this.paymentService
      .addPayment(this.payment)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.successMsg = this.ts.t('payments.success.create');
          const defCurrId = this.payment.currencyId;
          this.payment = {
            amount: 0,
            paymentMethod: 'Cash',
            currencyId: defCurrId,
          };
          this.selectedOrderIds = [];
          this.orderService
            .getOrders()
            .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
            .subscribe((data) => {
              this.orders = data.filter(
                (o) =>
                  o.status === 'Completed' && (o.totalPaid ?? 0) < o.totalCost,
              );
            });
          setTimeout(() => (this.successMsg = ''), 3000);
        },
        error: () => {
          this.errorMsg = this.ts.t('payments.error.create');
        },
      });
  }
}

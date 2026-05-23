import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaymentService } from '../../services/payment.service';
import { Payment } from '../../models/payment';
import { TranslationService } from '../../services/translation.service';
import { CurrencyService } from '../../services/currency.service';
import { Currency } from '../../models/currency';
import { DecimalPipe } from '@angular/common';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-view-payments',
  imports: [FormsModule, RouterModule, LocalDatePipe, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>&#128176; {{ 'payments.title' | translate }}</h1>
        <p>{{ 'payments.count' | translate: { count: payments.length } }}</p>
        @if (payments.length > 0) {
          <p class="payments-summary">
            {{ 'payments.totalCollected' | translate }}:
            <strong
              >{{ currSymbol }}{{ totalCollected | number: '1.2-2' }}</strong
            >
          </p>
        }
      </div>
      <div class="page-actions">
        <a routerLink="../payments/add" class="btn btn-primary"
          >+ {{ 'payments.new' | translate }}</a
        >
      </div>

      <div class="filter-bar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          [placeholder]="'payments.search' | translate"
          class="search-input"
        />
        <select [(ngModel)]="filterMethod" class="filter-select">
          <option value="">{{ 'payments.allMethods' | translate }}</option>
          <option value="Cash">{{ 'payments.method.cash' | translate }}</option>
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

      @if (errorMsg) {
        <div class="error-message">{{ errorMsg }}</div>
      }
      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }

      @if (filteredPayments.length > 0) {
        <div class="inventory-table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ 'payments.order' | translate }}</th>
                <th>{{ 'payments.vehicle' | translate }}</th>
                <th>{{ 'payments.customer' | translate }}</th>
                <th>{{ 'payments.amount' | translate }}</th>
                <th>{{ 'common.currency' | translate }}</th>
                <th>{{ 'payments.methodLabel' | translate }}</th>
                <th>{{ 'payments.reference' | translate }}</th>
                <th>{{ 'payments.date' | translate }}</th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filteredPayments; track p) {
                <tr>
                  @if (editingId !== p.id) {
                    <td>{{ p.id }}</td>
                    <td>
                      @for (oid of getOrderIds(p); track oid) {
                        <span class="order-badge" style="margin-right: 4px;"
                          >#{{ oid }}</span
                        >
                      }
                    </td>
                    <td>{{ p.carInfo || 'N/A' }}</td>
                    <td>{{ p.customerName || 'N/A' }}</td>
                    <td class="amount-cell">
                      {{ p.currencySymbol || currSymbol
                      }}{{ p.amount | number: '1.2-2' }}
                      @if (p.originalAmount) {
                        <br />
                      }
                      @if (p.originalAmount) {
                        <small style="color:#666;font-size:0.82em">
                          {{ 'payments.originalAmount' | translate }}:
                          {{ p.originalCurrencySymbol || '?'
                          }}{{ p.originalAmount | number: '1.2-2' }}
                        </small>
                      }
                    </td>
                    <td>{{ getCurrencyLabel(p.currencyId) }}</td>
                    <td>{{ getMethodLabel(p.paymentMethod) }}</td>
                    <td>{{ p.referenceNumber || '-' }}</td>
                    <td>{{ p.paymentDate | localDate: 'short' }}</td>
                    <td>
                      <a
                        class="btn-icon"
                        [routerLink]="['../payments', p.id, 'invoice']"
                        title="Invoice"
                        >&#128196;</a
                      >
                      <button
                        class="btn-icon"
                        (click)="startEdit(p)"
                        title="Edit"
                      >
                        &#9998;
                      </button>
                      <button
                        class="btn-icon btn-delete"
                        (click)="deletePayment(p.id!)"
                      >
                        &#128465;
                      </button>
                    </td>
                  }
                  @if (editingId === p.id) {
                    <td>{{ p.id }}</td>
                    <td>
                      @for (oid of getOrderIds(p); track oid) {
                        <span class="order-badge" style="margin-right: 4px;"
                          >#{{ oid }}</span
                        >
                      }
                    </td>
                    <td>{{ p.carInfo || 'N/A' }}</td>
                    <td>{{ p.customerName || 'N/A' }}</td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="editItem.amount"
                        class="inline-edit-input"
                        style="width:90px"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <select
                        [(ngModel)]="editItem.currencyId"
                        class="inline-edit-input"
                        style="width:90px"
                      >
                        @for (c of currencies; track c) {
                          <option [ngValue]="c.id">
                            {{ c.symbol }} {{ c.code }}
                          </option>
                        }
                      </select>
                    </td>
                    <td>
                      <select
                        [(ngModel)]="editItem.paymentMethod"
                        class="inline-edit-input"
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
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.referenceNumber"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>{{ p.paymentDate | localDate: 'short' }}</td>
                    <td>
                      <button
                        class="btn-icon btn-save"
                        (click)="saveEdit()"
                        title="Save"
                      >
                        &#128190;
                      </button>
                      <button
                        class="btn-icon"
                        (click)="cancelEdit()"
                        title="Cancel"
                      >
                        &#10060;
                      </button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (filteredPayments.length === 0 && !loading) {
        <div class="empty-state">
          <p>
            {{ 'payments.empty' | translate }}
            <a routerLink="../payments/add">{{
              'payments.createFirst' | translate
            }}</a
            >.
          </p>
        </div>
      }
      @if (loading) {
        <div class="loading">
          {{ 'payments.loading' | translate }}
        </div>
      }
    </div>
  `,
})
export class ViewPaymentsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  payments: Payment[] = [];
  loading = true;
  searchTerm = '';
  filterMethod = '';
  editingId: number | null = null;
  editItem: Payment = { amount: 0, paymentMethod: 'Cash' };
  errorMsg = '';
  successMsg = '';
  currSymbol = '₡';
  currencies: Currency[] = [];

  get totalCollected(): number {
    return this.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  get filteredPayments(): Payment[] {
    return this.payments.filter((p) => {
      const matchSearch =
        !this.searchTerm ||
        (p.carInfo || '')
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        (p.customerName || '')
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        (p.referenceNumber || '')
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        (p.notes || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (p.orderInfo || '').includes(this.searchTerm);
      const matchMethod =
        !this.filterMethod || p.paymentMethod === this.filterMethod;
      return matchSearch && matchMethod;
    });
  }

  constructor(
    private paymentService: PaymentService,
    private currencyService: CurrencyService,
    public ts: TranslationService,
  ) {}

  ngOnInit(): void {
    this.loadPayments();
    this.currencyService
      .getActiveCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((list) => {
        this.currencies = list;
        const def = list.find((c) => c.isDefault);
        if (def) this.currSymbol = def.symbol;
      });
  }

  loadPayments(): void {
    this.paymentService
      .getPayments()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (data) => {
          this.payments = data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  startEdit(p: Payment): void {
    this.editingId = p.id!;
    this.editItem = { ...p };
    this.clearMessages();
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    this.paymentService
      .updatePayment(this.editItem)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.editingId = null;
          this.successMsg = this.ts.t('common.updateSuccess');
          this.loadPayments();
        },
        error: () => {
          this.errorMsg = this.ts.t('common.updateError');
        },
      });
  }

  deletePayment(id: number): void {
    if (!confirm(this.ts.t('payments.confirmDelete'))) return;
    this.clearMessages();
    this.paymentService
      .deletePayment(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => this.loadPayments(),
        error: () => {
          this.errorMsg = this.ts.t('common.deleteError');
        },
      });
  }

  getMethodLabel(method: string): string {
    const key = 'payments.method.' + this.methodKey(method);
    return this.ts.t(key);
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Pending: 'status.pending',
      'In Progress': 'status.inProgress',
      Completed: 'status.completed',
      Cancelled: 'status.cancelled',
    };
    return this.ts.t(map[status] || status);
  }

  private methodKey(method: string): string {
    const map: Record<string, string> = {
      Cash: 'cash',
      'Credit Card': 'creditCard',
      'Debit Card': 'debitCard',
      Transfer: 'transfer',
      Check: 'check',
      Other: 'other',
    };
    return map[method] || 'other';
  }

  private clearMessages(): void {
    this.errorMsg = '';
    this.successMsg = '';
  }

  getCurrencyLabel(currencyId?: number): string {
    if (!currencyId) return '-';
    const c = this.currencies.find((cur) => cur.id === currencyId);
    return c ? `${c.symbol} ${c.code}` : '-';
  }

  getOrderIds(p: Payment): string[] {
    return p.orderInfo ? p.orderInfo.split(',') : [];
  }
}

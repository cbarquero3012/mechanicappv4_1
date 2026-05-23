import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyService } from '../../services/currency.service';
import { Currency } from '../../models/currency';
import { TranslationService } from '../../services/translation.service';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-view-currencies',
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>&#128178; {{ 'currencies.title' | translate }}</h1>
        <p>
          {{ 'currencies.count' | translate: { count: currencies.length } }}
        </p>
      </div>
      <div class="page-actions">
        <a routerLink="../currencies/add" class="btn btn-primary"
          >+ {{ 'currencies.add' | translate }}</a
        >
      </div>

      <div class="filter-bar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          [placeholder]="'currencies.search' | translate"
          class="search-input"
        />
      </div>

      @if (errorMsg) {
        <div class="error-message">{{ errorMsg }}</div>
      }
      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }

      @if (filteredCurrencies.length > 0) {
        <div class="inventory-table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ 'currencies.code' | translate }}</th>
                <th>{{ 'currencies.name' | translate }}</th>
                <th>{{ 'currencies.symbol' | translate }}</th>
                <th>{{ 'currencies.exchangeRate' | translate }}</th>
                <th>{{ 'currencies.default' | translate }}</th>
                <th>{{ 'common.status' | translate }}</th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filteredCurrencies; track c) {
                <tr>
                  @if (editingId !== c.id) {
                    <td>{{ c.id }}</td>
                    <td>
                      <strong>{{ c.code }}</strong>
                    </td>
                    <td>{{ c.name }}</td>
                    <td>{{ c.symbol }}</td>
                    <td>{{ c.exchangeRate }}</td>
                    <td>
                      <span
                        class="badge"
                        [class.badge-active]="c.isDefault"
                        [class.badge-inactive]="!c.isDefault"
                      >
                        {{
                          c.isDefault
                            ? ('currencies.yes' | translate)
                            : ('currencies.no' | translate)
                        }}
                      </span>
                    </td>
                    <td>
                      <span
                        class="badge"
                        [class.badge-active]="c.isActive"
                        [class.badge-inactive]="!c.isActive"
                      >
                        {{
                          c.isActive
                            ? ('common.active' | translate)
                            : ('common.inactive' | translate)
                        }}
                      </span>
                    </td>
                    <td>
                      <button
                        class="btn-icon"
                        (click)="startEdit(c)"
                        title="Edit"
                      >
                        &#9998;
                      </button>
                      @if (!c.isDefault) {
                        <button
                          class="btn-icon btn-delete"
                          (click)="deleteCurrency(c)"
                        >
                          &#128465;
                        </button>
                      }
                    </td>
                  }
                  @if (editingId === c.id) {
                    <td>{{ c.id }}</td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.code"
                        class="inline-edit-input"
                        maxlength="3"
                        style="width:60px"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.name"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.symbol"
                        class="inline-edit-input"
                        maxlength="5"
                        style="width:50px"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="editItem.exchangeRate"
                        class="inline-edit-input"
                        step="0.000001"
                        style="width:100px"
                      />
                    </td>
                    <td>
                      <input type="checkbox" [(ngModel)]="editItem.isDefault" />
                    </td>
                    <td>
                      <input type="checkbox" [(ngModel)]="editItem.isActive" />
                    </td>
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

      @if (filteredCurrencies.length === 0 && !errorMsg) {
        <div class="empty-state">
          <p>{{ 'currencies.empty' | translate }}</p>
          <a routerLink="../currencies/add" class="btn btn-primary">
            {{ 'currencies.createFirst' | translate }}
          </a>
        </div>
      }
    </div>
  `,
})
export class ViewCurrenciesComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  currencies: Currency[] = [];
  searchTerm = '';
  errorMsg = '';
  successMsg = '';
  editingId: number | null = null;
  editItem: Currency = {
    code: '',
    name: '',
    symbol: '',
    exchangeRate: 1,
    isDefault: false,
    isActive: true,
  };

  constructor(
    private currencyService: CurrencyService,
    public ts: TranslationService,
  ) {}

  ngOnInit(): void {
    this.loadCurrencies();
  }

  loadCurrencies(): void {
    this.currencyService
      .getCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (data) => (this.currencies = data),
        error: () => (this.errorMsg = this.ts.t('currencies.error.load')),
      });
  }

  get filteredCurrencies(): Currency[] {
    if (!this.searchTerm) return this.currencies;
    const term = this.searchTerm.toLowerCase();
    return this.currencies.filter(
      (c) =>
        c.code.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        c.symbol.toLowerCase().includes(term),
    );
  }

  startEdit(c: Currency): void {
    this.editingId = c.id!;
    this.editItem = { ...c };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    this.currencyService
      .updateCurrency(this.editItem)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.successMsg = this.ts.t('common.updateSuccess');
          this.editingId = null;
          this.loadCurrencies();
          setTimeout(() => (this.successMsg = ''), 3000);
        },
        error: () => (this.errorMsg = this.ts.t('common.updateError')),
      });
  }

  deleteCurrency(c: Currency): void {
    if (c.isDefault) return;
    if (!confirm(this.ts.t('currencies.confirmDelete'))) return;
    this.currencyService
      .deleteCurrency(c.id!)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.loadCurrencies();
          this.successMsg = this.ts.t('currencies.success.delete', {
            code: c.code,
          });
          setTimeout(() => (this.successMsg = ''), 3000);
        },
        error: () => (this.errorMsg = this.ts.t('common.deleteError')),
      });
  }
}

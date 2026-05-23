import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgForm } from '@angular/forms';
import { CurrencyService } from '../../services/currency.service';
import { Currency } from '../../models/currency';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-add-currency',
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>+ {{ 'currencies.addTitle' | translate }}</h1>
        <p>{{ 'currencies.addSubtitle' | translate }}</p>
      </div>
      <div class="page-actions">
        <a [routerLink]="'/' + slug + '/currencies'" class="btn btn-outline"
          >&larr; {{ 'currencies.viewCurrencies' | translate }}</a
        >
      </div>

      <form
        (ngSubmit)="onSubmit()"
        #currencyForm="ngForm"
        class="inventory-form"
      >
        <div class="form-row">
          <div class="form-group">
            <label for="code">{{ 'currencies.code' | translate }} *</label>
            <input
              id="code"
              type="text"
              [(ngModel)]="currency.code"
              name="code"
              [placeholder]="'currencies.codePlaceholder' | translate"
              required
              maxlength="3"
              style="text-transform: uppercase"
            />
          </div>
          <div class="form-group">
            <label for="name">{{ 'currencies.name' | translate }} *</label>
            <input
              id="name"
              type="text"
              [(ngModel)]="currency.name"
              name="name"
              [placeholder]="'currencies.namePlaceholder' | translate"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="symbol">{{ 'currencies.symbol' | translate }} *</label>
            <input
              id="symbol"
              type="text"
              [(ngModel)]="currency.symbol"
              name="symbol"
              [placeholder]="'currencies.symbolPlaceholder' | translate"
              required
              maxlength="5"
            />
          </div>
          <div class="form-group">
            <label for="exchangeRate"
              >{{ 'currencies.exchangeRate' | translate }} *</label
            >
            <input
              id="exchangeRate"
              type="number"
              [(ngModel)]="currency.exchangeRate"
              name="exchangeRate"
              step="0.000001"
              min="0"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>
              <input
                type="checkbox"
                [(ngModel)]="currency.isDefault"
                name="isDefault"
              />
              {{ 'currencies.setDefault' | translate }}
            </label>
          </div>
          <div class="form-group">
            <label>
              <input
                type="checkbox"
                [(ngModel)]="currency.isActive"
                name="isActive"
              />
              {{ 'currencies.setActive' | translate }}
            </label>
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="!currencyForm.valid"
        >
          {{ 'currencies.save' | translate }}
        </button>
      </form>

      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }
      @if (errorMsg) {
        <div class="error-message">{{ errorMsg }}</div>
      }
    </div>
  `,
})
export class AddCurrencyComponent {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('currencyForm') currencyForm!: NgForm;
  currency: Currency = {
    code: '',
    name: '',
    symbol: '',
    exchangeRate: 1,
    isDefault: false,
    isActive: true,
  };
  successMsg = '';
  errorMsg = '';

  constructor(
    private currencyService: CurrencyService,
    public ts: TranslationService,
    private toast: ToastService,
    private router: Router,
  ) {}

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  onSubmit(): void {
    if (this.currencyForm?.invalid) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.currency.code = this.currency.code.toUpperCase();
    this.currencyService
      .addCurrency(this.currency)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.successMsg = this.ts.t('currencies.success.add', {
            code: this.currency.code,
          });
          this.currency = {
            code: '',
            name: '',
            symbol: '',
            exchangeRate: 1,
            isDefault: false,
            isActive: true,
          };
          this.errorMsg = '';
        },
        error: () => {
          this.errorMsg = this.ts.t('currencies.error.add');
        },
      });
  }
}

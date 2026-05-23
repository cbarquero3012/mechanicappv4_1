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
import { InventoryService } from '../../../services/inventory.service';
import { MechanicService } from '../../../models/mechanic-service';
import { TranslationService } from '../../../services/translation.service';
import { ToastService } from '../../../services/toast.service';
import { CurrencyService } from '../../../services/currency.service';
import { Currency } from '../../../models/currency';

import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { markDirty } from '../../../utils/mark-dirty';

@Component({
  selector: 'app-add-service',
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inventory-page">
      <div class="page-header">
        <h1>+ {{ 'services.addTitle' | translate }}</h1>
        <p>{{ 'services.addSubtitle' | translate }}</p>
      </div>
      <div class="page-actions">
        <a
          [routerLink]="'/' + slug + '/inventory/services'"
          class="btn btn-outline"
          >&larr; {{ 'services.viewServices' | translate }}</a
        >
      </div>

      <form
        (ngSubmit)="onSubmit()"
        #serviceForm="ngForm"
        class="inventory-form"
      >
        @if (errorMsg) {
          <div class="error-message">{{ errorMsg }}</div>
        }
        <div class="form-row">
          <div class="form-group">
            <label for="name">{{ 'services.serviceName' | translate }} *</label>
            <input
              id="name"
              type="text"
              [(ngModel)]="service.name"
              name="name"
              required
            />
          </div>
          <div class="form-group">
            <label for="category">{{ 'common.category' | translate }}</label>
            <input
              id="category"
              type="text"
              [(ngModel)]="service.category"
              name="category"
              [placeholder]="'services.categoryPlaceholder' | translate"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label for="description">{{
              'common.description' | translate
            }}</label>
            <textarea
              id="description"
              [(ngModel)]="service.description"
              name="description"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="basePrice"
              >{{ 'services.basePrice' | translate }} *</label
            >
            <input
              id="basePrice"
              type="number"
              [(ngModel)]="service.basePrice"
              name="basePrice"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div class="form-group">
            <label for="currency">{{ 'common.currency' | translate }}</label>
            <select
              id="currency"
              [(ngModel)]="service.currencyId"
              name="currencyId"
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
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="estimatedHours">{{
              'services.estHours' | translate
            }}</label>
            <input
              id="estimatedHours"
              type="number"
              [(ngModel)]="service.estimatedHours"
              name="estimatedHours"
              step="0.25"
              min="0"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="service.isActive"
                name="isActive"
              />
              {{ 'services.activeLabel' | translate }}
            </label>
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="!serviceForm.valid"
        >
          {{ 'services.save' | translate }}
        </button>
      </form>

      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }
    </div>
  `,
})
export class AddServiceComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('serviceForm') serviceForm!: NgForm;
  service: MechanicService = {
    name: '',
    category: 'General',
    basePrice: 0,
    isActive: true,
  };
  successMsg = '';
  errorMsg = '';
  currencies: Currency[] = [];

  constructor(
    private inventoryService: InventoryService,
    private currencyService: CurrencyService,
    public ts: TranslationService,
    private toast: ToastService,
    private router: Router,
  ) {}

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  ngOnInit(): void {
    this.currencyService
      .getActiveCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((list) => {
        this.currencies = list;
        const def = list.find((c) => c.isDefault);
        if (def) this.service.currencyId = def.id;
      });
  }

  onSubmit(): void {
    if (this.serviceForm?.invalid) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.errorMsg = '';
    this.inventoryService
      .addService(this.service)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.successMsg = this.ts.t('services.success.add', {
            name: this.service.name,
          });
          const defCurrId = this.service.currencyId;
          this.service = {
            name: '',
            category: 'General',
            basePrice: 0,
            isActive: true,
            currencyId: defCurrId,
          };
          setTimeout(() => (this.successMsg = ''), 3000);
        },
        error: () => {
          this.errorMsg = this.ts.t('services.error.add');
        },
      });
  }
}

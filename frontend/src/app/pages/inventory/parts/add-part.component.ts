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
import { Part } from '../../../models/part';
import { TranslationService } from '../../../services/translation.service';
import { ToastService } from '../../../services/toast.service';
import { CurrencyService } from '../../../services/currency.service';
import { Currency } from '../../../models/currency';

import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { markDirty } from '../../../utils/mark-dirty';

@Component({
  selector: 'app-add-part',
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inventory-page">
      <div class="page-header">
        <h1>+ {{ 'parts.addTitle' | translate }}</h1>
        <p>{{ 'parts.addSubtitle' | translate }}</p>
      </div>
      <div class="page-actions">
        <a
          [routerLink]="'/' + slug + '/inventory/parts'"
          class="btn btn-outline"
          >&larr; {{ 'parts.viewParts' | translate }}</a
        >
      </div>

      <form (ngSubmit)="onSubmit()" #partForm="ngForm" class="inventory-form">
        @if (errorMsg) {
          <div class="error-message">{{ errorMsg }}</div>
        }
        <div class="form-row">
          <div class="form-group">
            <label for="name">{{ 'parts.partName' | translate }} *</label>
            <input
              id="name"
              type="text"
              [(ngModel)]="part.name"
              name="name"
              required
            />
          </div>
          <div class="form-group">
            <label for="partNumber">{{ 'parts.partNumber' | translate }}</label>
            <input
              id="partNumber"
              type="text"
              [(ngModel)]="part.partNumber"
              name="partNumber"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="category">{{ 'common.category' | translate }}</label>
            <input
              id="category"
              type="text"
              [(ngModel)]="part.category"
              name="category"
              [placeholder]="'parts.categoryPlaceholder' | translate"
            />
          </div>
          <div class="form-group">
            <label for="supplier">{{ 'parts.supplier' | translate }}</label>
            <input
              id="supplier"
              type="text"
              [(ngModel)]="part.supplier"
              name="supplier"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="quantity">{{ 'common.quantity' | translate }} *</label>
            <input
              id="quantity"
              type="number"
              [(ngModel)]="part.quantity"
              name="quantity"
              min="0"
              required
            />
          </div>
          <div class="form-group">
            <label for="minStock">{{ 'common.minStock' | translate }}</label>
            <input
              id="minStock"
              type="number"
              [(ngModel)]="part.minStock"
              name="minStock"
              min="0"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="unitCost">{{ 'common.unitCost' | translate }}</label>
            <input
              id="unitCost"
              type="number"
              [(ngModel)]="part.unitCost"
              name="unitCost"
              step="0.01"
              min="0"
            />
          </div>
          <div class="form-group">
            <label for="sellPrice">{{ 'common.sellPrice' | translate }}</label>
            <input
              id="sellPrice"
              type="number"
              [(ngModel)]="part.sellPrice"
              name="sellPrice"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="currency">{{ 'common.currency' | translate }}</label>
            <select
              id="currency"
              [(ngModel)]="part.currencyId"
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
          <div class="form-group full-width">
            <label for="location">{{ 'parts.location' | translate }}</label>
            <input
              id="location"
              type="text"
              [(ngModel)]="part.location"
              name="location"
              [placeholder]="'parts.locationPlaceholder' | translate"
            />
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="!partForm.valid"
        >
          {{ 'parts.save' | translate }}
        </button>
      </form>

      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }
    </div>
  `,
})
export class AddPartComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('partForm') partForm!: NgForm;
  part: Part = {
    name: '',
    category: 'General',
    quantity: 0,
    minStock: 5,
    unitCost: 0,
    sellPrice: 0,
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
        if (def) this.part.currencyId = def.id;
      });
  }

  onSubmit(): void {
    if (this.partForm?.invalid) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.errorMsg = '';
    this.inventoryService
      .addPart(this.part)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.successMsg = this.ts.t('parts.success.add', {
            name: this.part.name,
          });
          const defCurrId = this.part.currencyId;
          this.part = {
            name: '',
            category: 'General',
            quantity: 0,
            minStock: 5,
            unitCost: 0,
            sellPrice: 0,
            currencyId: defCurrId,
          };
          setTimeout(() => (this.successMsg = ''), 3000);
        },
        error: () => {
          this.errorMsg = this.ts.t('parts.error.add');
        },
      });
  }
}

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
import { Product } from '../../../models/product';
import { TranslationService } from '../../../services/translation.service';
import { ToastService } from '../../../services/toast.service';
import { CurrencyService } from '../../../services/currency.service';
import { Currency } from '../../../models/currency';

import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { markDirty } from '../../../utils/mark-dirty';

@Component({
  selector: 'app-add-product',
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inventory-page">
      <div class="page-header">
        <h1>+ {{ 'products.addTitle' | translate }}</h1>
        <p>{{ 'products.addSubtitle' | translate }}</p>
      </div>
      <div class="page-actions">
        <a
          [routerLink]="'/' + slug + '/inventory/products'"
          class="btn btn-outline"
          >&larr; {{ 'products.viewProducts' | translate }}</a
        >
      </div>

      <form
        (ngSubmit)="onSubmit()"
        #productForm="ngForm"
        class="inventory-form"
      >
        @if (errorMsg) {
          <div class="error-message">{{ errorMsg }}</div>
        }
        <div class="form-row">
          <div class="form-group">
            <label for="name">{{ 'products.productName' | translate }} *</label>
            <input
              id="name"
              type="text"
              [(ngModel)]="product.name"
              name="name"
              required
            />
          </div>
          <div class="form-group">
            <label for="sku">SKU</label>
            <input id="sku" type="text" [(ngModel)]="product.sku" name="sku" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="category">{{ 'common.category' | translate }}</label>
            <input
              id="category"
              type="text"
              [(ngModel)]="product.category"
              name="category"
              [placeholder]="'products.categoryPlaceholder' | translate"
            />
          </div>
          <div class="form-group">
            <label for="brand">{{ 'products.brand' | translate }}</label>
            <input
              id="brand"
              type="text"
              [(ngModel)]="product.brand"
              name="brand"
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
              [(ngModel)]="product.description"
              name="description"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="quantity">{{ 'common.quantity' | translate }} *</label>
            <input
              id="quantity"
              type="number"
              [(ngModel)]="product.quantity"
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
              [(ngModel)]="product.minStock"
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
              [(ngModel)]="product.unitCost"
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
              [(ngModel)]="product.sellPrice"
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
              [(ngModel)]="product.currencyId"
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

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="!productForm.valid"
        >
          {{ 'products.save' | translate }}
        </button>
      </form>

      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }
    </div>
  `,
})
export class AddProductComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('productForm') productForm!: NgForm;
  product: Product = {
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
        if (def) this.product.currencyId = def.id;
      });
  }

  onSubmit(): void {
    if (this.productForm?.invalid) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.errorMsg = '';
    this.inventoryService
      .addProduct(this.product)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.successMsg = this.ts.t('products.success.add', {
            name: this.product.name,
          });
          const defCurrId = this.product.currencyId;
          this.product = {
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
          this.errorMsg = this.ts.t('products.error.add');
        },
      });
  }
}

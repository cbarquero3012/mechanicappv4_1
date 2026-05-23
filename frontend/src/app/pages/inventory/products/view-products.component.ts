import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InventoryService } from '../../../services/inventory.service';
import { Product } from '../../../models/product';
import { TranslationService } from '../../../services/translation.service';
import { CurrencyService } from '../../../services/currency.service';
import { Currency } from '../../../models/currency';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { markDirty } from '../../../utils/mark-dirty';

@Component({
  selector: 'app-view-products',
  imports: [FormsModule, RouterModule, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inventory-page">
      <div class="page-header">
        <h1>&#128230; {{ 'products.title' | translate }}</h1>
        <p>{{ 'products.count' | translate: { count: products.length } }}</p>
      </div>
      <div class="page-actions">
        <a
          [routerLink]="'/' + slug + '/inventory/products/add'"
          class="btn btn-primary"
          >+ {{ 'products.add' | translate }}</a
        >
        <a [routerLink]="'/' + slug + '/inventory'" class="btn btn-outline"
          >&larr; {{ 'inventory.title' | translate }}</a
        >
      </div>

      <div class="filter-bar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          [placeholder]="'products.search' | translate"
          class="search-input"
        />
        <select [(ngModel)]="filterCategory" class="filter-select">
          <option value="">{{ 'common.allCategories' | translate }}</option>
          @for (c of categories; track c) {
            <option [value]="c">{{ c }}</option>
          }
        </select>
      </div>

      @if (errorMsg) {
        <div class="error-message">{{ errorMsg }}</div>
      }
      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }

      @if (filteredProducts.length > 0) {
        <div class="inventory-table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>{{ 'common.name' | translate }}</th>
                <th>SKU</th>
                <th>{{ 'common.category' | translate }}</th>
                <th>{{ 'products.brand' | translate }}</th>
                <th>{{ 'common.qty' | translate }}</th>
                <th>{{ 'common.min' | translate }}</th>
                <th>{{ 'common.cost' | translate }}</th>
                <th>{{ 'common.price' | translate }}</th>
                <th>{{ 'common.currency' | translate }}</th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filteredProducts; track p) {
                <tr [class.low-stock]="p.quantity <= p.minStock">
                  @if (editingId !== p.id) {
                    <td>{{ p.name }}</td>
                    <td>{{ p.sku || '-' }}</td>
                    <td>
                      <span class="badge">{{ p.category }}</span>
                    </td>
                    <td>{{ p.brand || '-' }}</td>
                    <td>
                      <span
                        class="qty"
                        [class.qty-low]="p.quantity <= p.minStock"
                        [class.qty-ok]="p.quantity > p.minStock"
                      >
                        {{ p.quantity }}
                      </span>
                    </td>
                    <td>{{ p.minStock }}</td>
                    <td>
                      {{ p.currencySymbol || currSymbol
                      }}{{ p.unitCost | number: '1.2-2' }}
                    </td>
                    <td>
                      {{ p.currencySymbol || currSymbol
                      }}{{ p.sellPrice | number: '1.2-2' }}
                    </td>
                    <td>{{ getCurrencyLabel(p.currencyId) }}</td>
                    <td>
                      <button
                        class="btn-icon"
                        (click)="startEdit(p)"
                        title="Edit"
                      >
                        &#9998;
                      </button>
                      <button
                        class="btn-icon btn-delete"
                        (click)="deleteProduct(p.id!)"
                      >
                        &#128465;
                      </button>
                    </td>
                  }
                  @if (editingId === p.id) {
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
                        [(ngModel)]="editItem.sku"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.category"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.brand"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="editItem.quantity"
                        class="inline-edit-input"
                        style="width:60px"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="editItem.minStock"
                        class="inline-edit-input"
                        style="width:60px"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="editItem.unitCost"
                        class="inline-edit-input"
                        style="width:80px"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="editItem.sellPrice"
                        class="inline-edit-input"
                        style="width:80px"
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

      @if (filteredProducts.length === 0 && !loading) {
        <div class="empty-state">
          <p>
            {{ 'products.empty' | translate }}
            <a [routerLink]="'/' + slug + '/inventory/products/add'">{{
              'products.addFirst' | translate
            }}</a
            >.
          </p>
        </div>
      }
      @if (loading) {
        <div class="loading">
          {{ 'products.loading' | translate }}
        </div>
      }
    </div>
  `,
})
export class ViewProductsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  products: Product[] = [];
  loading = true;
  searchTerm = '';
  filterCategory = '';
  editingId: number | null = null;
  editItem: Product = {
    name: '',
    category: '',
    quantity: 0,
    minStock: 0,
    unitCost: 0,
    sellPrice: 0,
  };
  errorMsg = '';
  successMsg = '';
  currSymbol = '₡';
  currencies: Currency[] = [];

  get categories(): string[] {
    return [...new Set(this.products.map((p) => p.category))].sort();
  }

  get filteredProducts(): Product[] {
    return this.products.filter((p) => {
      const matchSearch =
        !this.searchTerm ||
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchCategory =
        !this.filterCategory || p.category === this.filterCategory;
      return matchSearch && matchCategory;
    });
  }

  constructor(
    private inventoryService: InventoryService,
    private currencyService: CurrencyService,
    public ts: TranslationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.currencyService
      .getActiveCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((list) => {
        this.currencies = list;
        const def = list.find((c) => c.isDefault);
        if (def) this.currSymbol = def.symbol;
      });
  }

  loadProducts(): void {
    this.loading = true;
    this.inventoryService
      .getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (data) => {
          this.products = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  startEdit(p: Product): void {
    this.editingId = p.id!;
    this.editItem = { ...p };
    this.clearMessages();
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    this.inventoryService
      .updateProduct(this.editItem)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.editingId = null;
          this.successMsg = this.ts.t('common.updateSuccess');
          this.loadProducts();
        },
        error: () => {
          this.errorMsg = this.ts.t('common.updateError');
        },
      });
  }

  deleteProduct(id: number): void {
    if (!confirm(this.ts.t('products.confirmDelete'))) return;
    this.clearMessages();
    this.inventoryService
      .deleteProduct(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => this.loadProducts(),
        error: () => {
          this.errorMsg = this.ts.t('common.deleteError');
        },
      });
  }

  private clearMessages(): void {
    this.errorMsg = '';
    this.successMsg = '';
  }

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  getCurrencyLabel(currencyId?: number): string {
    if (!currencyId) return '-';
    const c = this.currencies.find((cur) => cur.id === currencyId);
    return c ? `${c.symbol} ${c.code}` : '-';
  }
}

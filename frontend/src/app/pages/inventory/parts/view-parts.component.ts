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
import { Part } from '../../../models/part';
import { TranslationService } from '../../../services/translation.service';
import { CurrencyService } from '../../../services/currency.service';
import { Currency } from '../../../models/currency';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { markDirty } from '../../../utils/mark-dirty';

@Component({
  selector: 'app-view-parts',
  imports: [FormsModule, RouterModule, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inventory-page">
      <div class="page-header">
        <h1>&#9881; {{ 'parts.title' | translate }}</h1>
        <p>{{ 'parts.count' | translate: { count: parts.length } }}</p>
      </div>
      <div class="page-actions">
        <a
          [routerLink]="'/' + slug + '/inventory/parts/add'"
          class="btn btn-primary"
          >+ {{ 'parts.add' | translate }}</a
        >
        <a [routerLink]="'/' + slug + '/inventory'" class="btn btn-outline"
          >&larr; {{ 'inventory.title' | translate }}</a
        >
      </div>

      <div class="filter-bar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          [placeholder]="'parts.search' | translate"
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

      @if (filteredParts.length > 0) {
        <div class="inventory-table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>{{ 'common.name' | translate }}</th>
                <th>{{ 'parts.partNumber' | translate }}</th>
                <th>{{ 'common.category' | translate }}</th>
                <th>{{ 'common.qty' | translate }}</th>
                <th>{{ 'common.min' | translate }}</th>
                <th>{{ 'common.cost' | translate }}</th>
                <th>{{ 'common.price' | translate }}</th>
                <th>{{ 'common.currency' | translate }}</th>
                <th>{{ 'parts.supplier' | translate }}</th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filteredParts; track p) {
                <tr [class.low-stock]="p.quantity <= p.minStock">
                  @if (editingId !== p.id) {
                    <td>{{ p.name }}</td>
                    <td>{{ p.partNumber || '-' }}</td>
                    <td>
                      <span class="badge">{{ p.category }}</span>
                    </td>
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
                    <td>{{ p.supplier || '-' }}</td>
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
                        (click)="deletePart(p.id!)"
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
                        [(ngModel)]="editItem.partNumber"
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
                      <input
                        type="text"
                        [(ngModel)]="editItem.supplier"
                        class="inline-edit-input"
                      />
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

      @if (filteredParts.length === 0 && !loading) {
        <div class="empty-state">
          <p>
            {{ 'parts.empty' | translate }}
            <a [routerLink]="'/' + slug + '/inventory/parts/add'">{{
              'parts.addFirst' | translate
            }}</a
            >.
          </p>
        </div>
      }
      @if (loading) {
        <div class="loading">
          {{ 'parts.loading' | translate }}
        </div>
      }
    </div>
  `,
})
export class ViewPartsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  parts: Part[] = [];
  loading = true;
  searchTerm = '';
  filterCategory = '';
  editingId: number | null = null;
  editItem: Part = {
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
    return [...new Set(this.parts.map((p) => p.category))].sort();
  }

  get filteredParts(): Part[] {
    return this.parts.filter((p) => {
      const matchSearch =
        !this.searchTerm ||
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (p.partNumber || '')
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        (p.supplier || '')
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase());
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
    this.loadParts();
    this.currencyService
      .getActiveCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((list) => {
        this.currencies = list;
        const def = list.find((c) => c.isDefault);
        if (def) this.currSymbol = def.symbol;
      });
  }

  loadParts(): void {
    this.loading = true;
    this.inventoryService
      .getParts()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (data) => {
          this.parts = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  startEdit(p: Part): void {
    this.editingId = p.id!;
    this.editItem = { ...p };
    this.clearMessages();
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    this.inventoryService
      .updatePart(this.editItem)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.editingId = null;
          this.successMsg = this.ts.t('common.updateSuccess');
          this.loadParts();
        },
        error: () => {
          this.errorMsg = this.ts.t('common.updateError');
        },
      });
  }

  deletePart(id: number): void {
    if (!confirm(this.ts.t('parts.confirmDelete'))) return;
    this.clearMessages();
    this.inventoryService
      .deletePart(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => this.loadParts(),
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

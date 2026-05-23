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
import { MechanicService } from '../../../models/mechanic-service';
import { TranslationService } from '../../../services/translation.service';
import { CurrencyService } from '../../../services/currency.service';
import { Currency } from '../../../models/currency';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { markDirty } from '../../../utils/mark-dirty';

@Component({
  selector: 'app-view-services',
  imports: [FormsModule, RouterModule, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inventory-page">
      <div class="page-header">
        <h1>&#128736; {{ 'services.title' | translate }}</h1>
        <p>{{ 'services.count' | translate: { count: services.length } }}</p>
      </div>
      <div class="page-actions">
        <a
          [routerLink]="'/' + slug + '/inventory/services/add'"
          class="btn btn-primary"
          >+ {{ 'services.add' | translate }}</a
        >
        <a [routerLink]="'/' + slug + '/inventory'" class="btn btn-outline"
          >&larr; {{ 'inventory.title' | translate }}</a
        >
      </div>

      <div class="filter-bar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          [placeholder]="'services.search' | translate"
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

      @if (filteredServices.length > 0) {
        <div class="inventory-table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>{{ 'common.name' | translate }}</th>
                <th>{{ 'common.category' | translate }}</th>
                <th>{{ 'common.description' | translate }}</th>
                <th>{{ 'services.basePrice' | translate }}</th>
                <th>{{ 'common.currency' | translate }}</th>
                <th>{{ 'services.estHours' | translate }}</th>
                <th>{{ 'common.status' | translate }}</th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (s of filteredServices; track s) {
                <tr>
                  @if (editingId !== s.id) {
                    <td>{{ s.name }}</td>
                    <td>
                      <span class="badge">{{ s.category }}</span>
                    </td>
                    <td>{{ s.description || '-' }}</td>
                    <td>
                      {{ s.currencySymbol || currSymbol
                      }}{{ s.basePrice | number: '1.2-2' }}
                    </td>
                    <td>{{ getCurrencyLabel(s.currencyId) }}</td>
                    <td>{{ s.estimatedHours || '-' }}</td>
                    <td>
                      <span
                        class="status-badge"
                        [class.active]="s.isActive"
                        [class.inactive]="!s.isActive"
                      >
                        {{
                          s.isActive
                            ? ('common.active' | translate)
                            : ('common.inactive' | translate)
                        }}
                      </span>
                    </td>
                    <td>
                      <button
                        class="btn-icon"
                        (click)="startEdit(s)"
                        title="Edit"
                      >
                        &#9998;
                      </button>
                      <button
                        class="btn-icon btn-delete"
                        (click)="deleteService(s.id!)"
                      >
                        &#128465;
                      </button>
                    </td>
                  }
                  @if (editingId === s.id) {
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
                        [(ngModel)]="editItem.category"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.description"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="editItem.basePrice"
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
                        type="number"
                        [(ngModel)]="editItem.estimatedHours"
                        class="inline-edit-input"
                        style="width:60px"
                        step="0.5"
                      />
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

      @if (filteredServices.length === 0 && !loading) {
        <div class="empty-state">
          <p>
            {{ 'services.empty' | translate }}
            <a [routerLink]="'/' + slug + '/inventory/services/add'">{{
              'services.addFirst' | translate
            }}</a
            >.
          </p>
        </div>
      }
      @if (loading) {
        <div class="loading">
          {{ 'services.loading' | translate }}
        </div>
      }
    </div>
  `,
})
export class ViewServicesComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  services: MechanicService[] = [];
  loading = true;
  searchTerm = '';
  filterCategory = '';
  editingId: number | null = null;
  editItem: MechanicService = {
    name: '',
    category: '',
    basePrice: 0,
    isActive: true,
  };
  errorMsg = '';
  successMsg = '';
  currSymbol = '₡';
  currencies: Currency[] = [];

  get categories(): string[] {
    return [...new Set(this.services.map((s) => s.category))].sort();
  }

  get filteredServices(): MechanicService[] {
    return this.services.filter((s) => {
      const matchSearch =
        !this.searchTerm ||
        s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (s.description || '')
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase());
      const matchCategory =
        !this.filterCategory || s.category === this.filterCategory;
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
    this.loadServices();
    this.currencyService
      .getActiveCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((list) => {
        this.currencies = list;
        const def = list.find((c) => c.isDefault);
        if (def) this.currSymbol = def.symbol;
      });
  }

  loadServices(): void {
    this.loading = true;
    this.inventoryService
      .getServices()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (data) => {
          this.services = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  startEdit(s: MechanicService): void {
    this.editingId = s.id!;
    this.editItem = { ...s };
    this.clearMessages();
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    this.inventoryService
      .updateService(this.editItem)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.editingId = null;
          this.successMsg = this.ts.t('common.updateSuccess');
          this.loadServices();
        },
        error: () => {
          this.errorMsg = this.ts.t('common.updateError');
        },
      });
  }

  deleteService(id: number): void {
    if (!confirm(this.ts.t('services.confirmDelete'))) return;
    this.clearMessages();
    this.inventoryService
      .deleteService(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => this.loadServices(),
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

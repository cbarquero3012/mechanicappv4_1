import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CarBrandService } from '../../services/car-brand.service';
import { CarBrand } from '../../models/car-brand';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-view-car-brands',
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>&#127959; {{ 'brands.title' | translate }}</h1>
        <p>{{ 'brands.count' | translate: { count: brands.length } }}</p>
      </div>
      <div class="page-actions">
        <a routerLink="../car-brands/add" class="btn btn-primary"
          >+ {{ 'brands.add' | translate }}</a
        >
      </div>

      <div class="filter-bar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          [placeholder]="'brands.search' | translate"
          class="search-input"
        />
      </div>

      @if (errorMsg) {
        <div class="error-message">{{ errorMsg }}</div>
      }
      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }

      @if (filteredBrands.length > 0) {
        <div class="inventory-table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ 'brands.brandName' | translate }}</th>
                <th>{{ 'brands.country' | translate }}</th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (b of filteredBrands; track b) {
                <tr>
                  @if (editingId !== b.id) {
                    <td>{{ b.id }}</td>
                    <td>
                      <strong>{{ b.brandName }}</strong>
                    </td>
                    <td>{{ b.country || '-' }}</td>
                    <td>
                      <button
                        class="btn-icon"
                        (click)="startEdit(b)"
                        title="Edit"
                      >
                        &#9998;
                      </button>
                      <button
                        class="btn-icon btn-delete"
                        (click)="deleteBrand(b.id!)"
                      >
                        &#128465;
                      </button>
                    </td>
                  }
                  @if (editingId === b.id) {
                    <td>{{ b.id }}</td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.brandName"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.country"
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

      @if (filteredBrands.length === 0 && !loading) {
        <div class="empty-state">
          <p>
            {{ 'brands.empty' | translate }}
            <a routerLink="../car-brands/add">{{
              'brands.addFirst' | translate
            }}</a
            >.
          </p>
        </div>
      }
      @if (loading) {
        <div class="loading">
          {{ 'brands.loading' | translate }}
        </div>
      }
    </div>
  `,
})
export class ViewCarBrandsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  brands: CarBrand[] = [];
  loading = true;
  searchTerm = '';
  editingId: number | null = null;
  editItem: CarBrand = { brandName: '', country: '' };
  errorMsg = '';
  successMsg = '';

  get filteredBrands(): CarBrand[] {
    if (!this.searchTerm) return this.brands;
    const term = this.searchTerm.toLowerCase();
    return this.brands.filter(
      (b) =>
        b.brandName.toLowerCase().includes(term) ||
        (b.country || '').toLowerCase().includes(term),
    );
  }

  constructor(
    private brandService: CarBrandService,
    public ts: TranslationService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.loading = true;
    this.brandService
      .getBrands()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (data) => {
          this.brands = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  startEdit(b: CarBrand): void {
    this.editingId = b.id!;
    this.editItem = { ...b };
    this.clearMessages();
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    if (!this.editItem.brandName?.trim()) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.brandService
      .updateBrand(this.editItem)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.editingId = null;
          this.successMsg = this.ts.t('common.updateSuccess');
          this.loadBrands();
        },
        error: () => {
          this.errorMsg = this.ts.t('common.updateError');
        },
      });
  }

  deleteBrand(id: number): void {
    if (confirm(this.ts.t('brands.confirmDelete'))) {
      this.clearMessages();
      this.brandService
        .deleteBrand(id)
        .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
        .subscribe({
          next: () => this.loadBrands(),
          error: () => {
            this.errorMsg = this.ts.t('common.deleteError');
          },
        });
    }
  }

  private clearMessages(): void {
    this.errorMsg = '';
    this.successMsg = '';
  }
}

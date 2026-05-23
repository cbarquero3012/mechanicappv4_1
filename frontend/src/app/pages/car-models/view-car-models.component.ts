import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CarModelService } from '../../services/car-model.service';
import { CarBrandService } from '../../services/car-brand.service';
import { CarModel } from '../../models/car-model';
import { CarBrand } from '../../models/car-brand';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-view-car-models',
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>&#128663; {{ 'models.title' | translate }}</h1>
        <p>{{ 'models.count' | translate: { count: models.length } }}</p>
      </div>
      <div class="page-actions">
        <a routerLink="../car-models/add" class="btn btn-primary"
          >+ {{ 'models.add' | translate }}</a
        >
      </div>

      <div class="filter-bar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          [placeholder]="'models.search' | translate"
          class="search-input"
        />
      </div>

      @if (errorMsg) {
        <div class="error-message">{{ errorMsg }}</div>
      }
      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }

      @if (filteredModels.length > 0) {
        <div class="inventory-table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ 'brands.brandName' | translate }}</th>
                <th>{{ 'models.modelName' | translate }}</th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (m of filteredModels; track m) {
                <tr>
                  @if (editingId !== m.id) {
                    <td>{{ m.id }}</td>
                    <td>{{ m.brandName }}</td>
                    <td>
                      <strong>{{ m.modelName }}</strong>
                    </td>
                    <td>
                      <button
                        class="btn-icon"
                        (click)="startEdit(m)"
                        title="Edit"
                      >
                        &#9998;
                      </button>
                      <button
                        class="btn-icon btn-delete"
                        (click)="deleteModel(m.id!)"
                      >
                        &#128465;
                      </button>
                    </td>
                  }
                  @if (editingId === m.id) {
                    <td>{{ m.id }}</td>
                    <td>
                      <select
                        [(ngModel)]="editItem.brandId"
                        class="inline-edit-input"
                      >
                        @for (b of brands; track b) {
                          <option [ngValue]="b.id">
                            {{ b.brandName }}
                          </option>
                        }
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.modelName"
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

      @if (filteredModels.length === 0 && !loading) {
        <div class="empty-state">
          <p>
            {{ 'models.empty' | translate }}
            <a routerLink="../car-models/add">{{
              'models.addFirst' | translate
            }}</a
            >.
          </p>
        </div>
      }
      @if (loading) {
        <div class="loading">
          {{ 'models.loading' | translate }}
        </div>
      }
    </div>
  `,
})
export class ViewCarModelsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  models: CarModel[] = [];
  brands: CarBrand[] = [];
  loading = true;
  searchTerm = '';
  editingId: number | null = null;
  editItem: CarModel = { brandId: 0, modelName: '' };
  errorMsg = '';
  successMsg = '';

  get filteredModels(): CarModel[] {
    if (!this.searchTerm) return this.models;
    const term = this.searchTerm.toLowerCase();
    return this.models.filter(
      (m) =>
        m.modelName.toLowerCase().includes(term) ||
        (m.brandName || '').toLowerCase().includes(term),
    );
  }

  constructor(
    private modelService: CarModelService,
    private brandService: CarBrandService,
    public ts: TranslationService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadModels();
    this.brandService
      .getBrands()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((b) => (this.brands = b));
  }

  loadModels(): void {
    this.loading = true;
    this.modelService
      .getModels()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (data) => {
          this.models = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  startEdit(m: CarModel): void {
    this.editingId = m.id!;
    this.editItem = { ...m };
    this.clearMessages();
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    if (!this.editItem.modelName?.trim() || !this.editItem.brandId) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.modelService
      .updateModel(this.editItem)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.editingId = null;
          this.successMsg = this.ts.t('common.updateSuccess');
          this.loadModels();
        },
        error: () => {
          this.errorMsg = this.ts.t('common.updateError');
        },
      });
  }

  deleteModel(id: number): void {
    if (confirm(this.ts.t('models.confirmDelete'))) {
      this.clearMessages();
      this.modelService
        .deleteModel(id)
        .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
        .subscribe({
          next: () => this.loadModels(),
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

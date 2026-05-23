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
import { CarModelService } from '../../services/car-model.service';
import { CarBrandService } from '../../services/car-brand.service';
import { CarModel } from '../../models/car-model';
import { CarBrand } from '../../models/car-brand';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-add-car-model',
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>+ {{ 'models.addTitle' | translate }}</h1>
        <p>{{ 'models.addSubtitle' | translate }}</p>
      </div>
      <div class="page-actions">
        <a [routerLink]="'/' + slug + '/car-models'" class="btn btn-outline"
          >&larr; {{ 'models.viewModels' | translate }}</a
        >
      </div>

      <form (ngSubmit)="onSubmit()" #modelForm="ngForm" class="inventory-form">
        @if (errorMsg) {
          <div class="error-message">{{ errorMsg }}</div>
        }
        <div class="form-row">
          <div class="form-group">
            <label for="brandId">{{ 'brands.brandName' | translate }} *</label>
            <select
              id="brandId"
              [(ngModel)]="model.brandId"
              name="brandId"
              required
            >
              <option [ngValue]="0">
                -- {{ 'models.selectBrand' | translate }} --
              </option>
              @for (b of brands; track b) {
                <option [ngValue]="b.id">
                  {{ b.brandName }}
                </option>
              }
            </select>
          </div>
          <div class="form-group">
            <label for="modelName"
              >{{ 'models.modelName' | translate }} *</label
            >
            <input
              id="modelName"
              type="text"
              [(ngModel)]="model.modelName"
              name="modelName"
              [placeholder]="'models.modelNamePlaceholder' | translate"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="
            !modelForm.valid || model.brandId === 0 || !model.modelName
          "
        >
          {{ 'models.save' | translate }}
        </button>
      </form>

      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }
    </div>
  `,
})
export class AddCarModelComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('modelForm') modelForm!: NgForm;
  brands: CarBrand[] = [];
  model: CarModel = { brandId: 0, modelName: '' };
  successMsg = '';
  errorMsg = '';

  constructor(
    private modelService: CarModelService,
    private brandService: CarBrandService,
    public ts: TranslationService,
    private toast: ToastService,
    private router: Router,
  ) {}

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  ngOnInit(): void {
    this.brandService
      .getBrands()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((data) => (this.brands = data));
  }

  onSubmit(): void {
    if (this.modelForm?.invalid || this.model.brandId === 0) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.errorMsg = '';
    this.modelService
      .addModel(this.model)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          const brand = this.brands.find((b) => b.id === this.model.brandId);
          this.successMsg = this.ts.t('models.success.add', {
            name: (brand?.brandName || '') + ' ' + this.model.modelName,
          });
          this.model = { brandId: 0, modelName: '' };
          setTimeout(() => (this.successMsg = ''), 3000);
        },
        error: () => {
          this.errorMsg = this.ts.t('models.error.add');
        },
      });
  }
}

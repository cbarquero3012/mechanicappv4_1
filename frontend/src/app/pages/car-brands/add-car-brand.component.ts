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
import { CarBrandService } from '../../services/car-brand.service';
import { CarBrand } from '../../models/car-brand';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-add-car-brand',
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>+ {{ 'brands.addTitle' | translate }}</h1>
        <p>{{ 'brands.addSubtitle' | translate }}</p>
      </div>
      <div class="page-actions">
        <a [routerLink]="'/' + slug + '/car-brands'" class="btn btn-outline"
          >&larr; {{ 'brands.viewBrands' | translate }}</a
        >
      </div>

      <form (ngSubmit)="onSubmit()" #brandForm="ngForm" class="inventory-form">
        @if (errorMsg) {
          <div class="error-message">{{ errorMsg }}</div>
        }
        <div class="form-row">
          <div class="form-group">
            <label for="brandName"
              >{{ 'brands.brandName' | translate }} *</label
            >
            <input
              id="brandName"
              type="text"
              [(ngModel)]="brand.brandName"
              name="brandName"
              [placeholder]="'brands.brandNamePlaceholder' | translate"
              required
            />
          </div>
          <div class="form-group">
            <label for="country">{{ 'brands.country' | translate }}</label>
            <input
              id="country"
              type="text"
              [(ngModel)]="brand.country"
              name="country"
              [placeholder]="'brands.countryPlaceholder' | translate"
            />
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="!brandForm.valid"
        >
          {{ 'brands.save' | translate }}
        </button>
      </form>

      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }
    </div>
  `,
})
export class AddCarBrandComponent {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('brandForm') brandForm!: NgForm;
  brand: CarBrand = { brandName: '' };
  successMsg = '';
  errorMsg = '';

  constructor(
    private brandService: CarBrandService,
    public ts: TranslationService,
    private toast: ToastService,
    private router: Router,
  ) {}

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  onSubmit(): void {
    if (this.brandForm?.invalid) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.errorMsg = '';
    this.brandService
      .addBrand(this.brand)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.successMsg = this.ts.t('brands.success.add', {
            name: this.brand.brandName,
          });
          this.brand = { brandName: '' };
          setTimeout(() => (this.successMsg = ''), 3000);
        },
        error: () => {
          this.errorMsg = this.ts.t('brands.error.add');
        },
      });
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  DestroyRef,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgForm } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-add-customer',
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>+ {{ 'customers.addTitle' | translate }}</h1>
        <p>{{ 'customers.addSubtitle' | translate }}</p>
      </div>
      <div class="page-actions">
        <a [routerLink]="'/' + slug + '/customers'" class="btn btn-outline"
          >&larr; {{ 'customers.viewCustomers' | translate }}</a
        >
      </div>

      <form
        (ngSubmit)="onSubmit()"
        #customerForm="ngForm"
        class="inventory-form"
      >
        @if (errorMsg) {
          <div class="error-message">{{ errorMsg }}</div>
        }
        <div class="form-row">
          <div class="form-group">
            <label for="firstName"
              >{{ 'customers.firstName' | translate }} *</label
            >
            <input
              id="firstName"
              type="text"
              [(ngModel)]="customer.firstName"
              name="firstName"
              required
            />
          </div>
          <div class="form-group">
            <label for="lastName"
              >{{ 'customers.lastName' | translate }} *</label
            >
            <input
              id="lastName"
              type="text"
              [(ngModel)]="customer.lastName"
              name="lastName"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="email">{{ 'customers.email' | translate }}</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="customer.email"
              name="email"
            />
          </div>
          <div class="form-group">
            <label for="phoneNumber"
              >{{ 'customers.phone' | translate }} *</label
            >
            <input
              id="phoneNumber"
              type="text"
              [(ngModel)]="customer.phoneNumber"
              name="phoneNumber"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label for="address">{{ 'customers.address' | translate }}</label>
            <input
              id="address"
              type="text"
              [(ngModel)]="customer.address"
              name="address"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="idClient">{{ 'customers.idClient' | translate }}</label>
            <input
              id="idClient"
              type="text"
              [(ngModel)]="customer.idClient"
              name="idClient"
            />
          </div>
          <div class="form-group">
            <label for="economicActivityCode">{{
              'customers.economicActivityCode' | translate
            }}</label>
            <input
              id="economicActivityCode"
              type="text"
              [(ngModel)]="customer.economicActivityCode"
              name="economicActivityCode"
            />
            <small class="field-hint">{{
              'customers.economicActivityCodeHint' | translate
            }}</small>
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="!customerForm.valid"
        >
          {{ 'customers.save' | translate }}
        </button>
      </form>

      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }
    </div>
  `,
})
export class AddCustomerComponent {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('customerForm') customerForm!: NgForm;
  customer: Customer = { firstName: '', lastName: '', phoneNumber: '' };
  successMsg = '';
  errorMsg = '';

  constructor(
    private customerService: CustomerService,
    public ts: TranslationService,
    private toast: ToastService,
    private router: Router,
  ) {}

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  onSubmit(): void {
    if (this.customerForm?.invalid) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.errorMsg = '';
    this.customerService
      .addCustomer(this.customer)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.successMsg = this.ts.t('customers.success.add', {
            name: this.customer.firstName + ' ' + this.customer.lastName,
          });
          this.customer = { firstName: '', lastName: '', phoneNumber: '' };
          setTimeout(() => (this.successMsg = ''), 3000);
        },
        error: () => {
          this.errorMsg = this.ts.t('customers.error.add');
        },
      });
  }
}

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
import { MechanicService } from '../../services/mechanic.service';
import { Mechanic, MechanicUserOption } from '../../models/mechanic';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-add-mechanic',
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>+ {{ 'mechanics.addTitle' | translate }}</h1>
        <p>{{ 'mechanics.addSubtitle' | translate }}</p>
      </div>
      <div class="page-actions">
        <a [routerLink]="'/' + slug + '/mechanics'" class="btn btn-outline"
          >&larr; {{ 'mechanics.viewMechanics' | translate }}</a
        >
      </div>

      <form
        (ngSubmit)="onSubmit()"
        #mechanicForm="ngForm"
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
              [(ngModel)]="mechanic.firstName"
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
              [(ngModel)]="mechanic.lastName"
              name="lastName"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="specialty">{{
              'mechanics.specialty' | translate
            }}</label>
            <input
              id="specialty"
              type="text"
              [(ngModel)]="mechanic.specialty"
              name="specialty"
              [placeholder]="'mechanics.specialtyPlaceholder' | translate"
            />
          </div>
          <div class="form-group">
            <label for="hireDate">{{ 'mechanics.hireDate' | translate }}</label>
            <input
              id="hireDate"
              type="date"
              [(ngModel)]="mechanic.hireDate"
              name="hireDate"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="mechanic.isActive"
                name="isActive"
              />
              {{ 'mechanics.activeLabel' | translate }}
            </label>
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="!mechanicForm.valid"
        >
          {{ 'mechanics.save' | translate }}
        </button>
      </form>

      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }
    </div>
  `,
})
export class AddMechanicComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('mechanicForm') mechanicForm!: NgForm;
  mechanic: Mechanic = {
    firstName: '',
    lastName: '',
    isActive: true,
    /*linkedUserId: null,*/
  };
  successMsg = '';
  errorMsg = '';
  availableUsers: MechanicUserOption[] = [];

  constructor(
    private mechanicService: MechanicService,
    public ts: TranslationService,
    private toast: ToastService,
    private router: Router,
  ) {}

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  ngOnInit(): void {
    this.loadAvailableUsers();
  }

  loadAvailableUsers(): void {
    this.mechanicService
      .getAvailableUsers()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (users) => {
          // Show only users not already linked to another mechanic
          this.availableUsers = users.filter((u) => !u.mechanicId);
        },
        error: () => {
          this.toast.error(this.ts.t('mechanics.error.loadUsers'));
        },
      });
  }

  onSubmit(): void {
    if (this.mechanicForm?.invalid) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.errorMsg = '';
    const payload: Mechanic = { ...this.mechanic };
    if (!payload.hireDate) delete payload.hireDate;
    if (!payload.specialty) delete payload.specialty;
    this.mechanicService
      .addMechanic(payload)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.successMsg = this.ts.t('mechanics.success.add', {
            name: this.mechanic.firstName + ' ' + this.mechanic.lastName,
          });
          this.mechanic = {
            firstName: '',
            lastName: '',
            isActive: true,
            /*linkedUserId: null,*/
          };
          this.loadAvailableUsers();
          setTimeout(() => (this.successMsg = ''), 3000);
        },
        error: () => {
          this.errorMsg = this.ts.t('mechanics.error.add');
        },
      });
  }
}

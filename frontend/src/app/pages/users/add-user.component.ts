import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { UserService } from '../../services/user.service';
import { MechanicService } from '../../services/mechanic.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { CreateUser } from '../../models/user';
import { Mechanic } from '../../models/mechanic';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-add-user',
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>
          {{
            isEdit
              ? ('users.editTitle' | translate)
              : ('users.addTitle' | translate)
          }}
        </h1>
      </div>

      <div class="form-card">
        @if (errorMsg) {
          <div class="error-message">{{ errorMsg }}</div>
        }
        @if (successMsg) {
          <div class="success-message">{{ successMsg }}</div>
        }

        <div class="form-row">
          <div class="form-group">
            <label>{{ 'users.fullName' | translate }}</label>
            <input type="text" [(ngModel)]="user.fullName" />
          </div>
          <div class="form-group">
            <label>{{ 'users.username' | translate }} *</label>
            <input type="text" [(ngModel)]="user.username" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ 'users.email' | translate }}</label>
            <input type="email" [(ngModel)]="user.email" />
          </div>
          <div class="form-group">
            <label>{{ 'users.role' | translate }}</label>
            <select [(ngModel)]="user.role">
              @if (authService.isSuperAdmin) {
                <option value="super-admin">
                  {{ 'users.role.superAdmin' | translate }}
                </option>
              }
              <option value="admin">
                {{ 'users.role.admin' | translate }}
              </option>
              <option value="supervisor">
                {{ 'users.role.supervisor' | translate }}
              </option>
              <option value="mechanic">
                {{ 'users.role.mechanic' | translate }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ 'onboarding.country' | translate }}</label>
            <select [(ngModel)]="user.country">
              <option value="">
                — {{ 'onboarding.countryPlaceholder' | translate }} —
              </option>
              @for (c of countryList; track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>
              {{ 'users.password' | translate }}
              {{ isEdit ? '' : '*' }}
            </label>
            <input
              type="password"
              [(ngModel)]="user.password"
              [placeholder]="isEdit ? ('users.passwordHint' | translate) : ''"
            />
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" [(ngModel)]="userActive" />
              {{ 'common.active' | translate }}
            </label>
          </div>
        </div>

        @if (user.role === 'mechanic') {
          <div class="form-row">
            <div class="form-group">
              <label>{{ 'users.linkedMechanic' | translate }}</label>
              <select [(ngModel)]="user.mechanicId">
                <option [ngValue]="null">
                  — {{ 'users.noMechanicLinked' | translate }} —
                </option>
                @for (m of mechanics; track m) {
                  <option [ngValue]="m.id">
                    {{ m.firstName }} {{ m.lastName }}
                  </option>
                }
              </select>
            </div>
          </div>
        }

        <div class="form-actions">
          <button
            class="btn btn-primary"
            (click)="save()"
            [disabled]="saving || !user.username || (!isEdit && !user.password)"
          >
            {{
              saving
                ? ('common.saving' | translate)
                : ('common.save' | translate)
            }}
          </button>
          <a [routerLink]="'/' + slug + '/users'" class="btn btn-outline">{{
            'common.cancel' | translate
          }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .form-card {
        background: #fff;
        border-radius: 12px;
        padding: 28px;
        max-width: 700px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
      }
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 16px;
      }
      .form-group label {
        display: block;
        font-size: 0.85rem;
        color: #555;
        margin-bottom: 4px;
        font-weight: 500;
      }
      .form-group input,
      .form-group select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-size: 0.95rem;
      }
      .form-group input:focus,
      .form-group select:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
      }
      .checkbox-group {
        display: flex;
        align-items: flex-end;
        padding-bottom: 8px;
      }
      .checkbox-group label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 0.95rem;
      }
      .checkbox-group input[type='checkbox'] {
        width: 18px;
        height: 18px;
      }
      .form-actions {
        margin-top: 24px;
        display: flex;
        gap: 12px;
      }
      @media (max-width: 600px) {
        .form-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AddUserComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  user: CreateUser = {
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'mechanic',
    mechanicId: null,
    country: '',
  };
  userActive = true;
  isEdit = false;
  editId = 0;
  saving = false;
  errorMsg = '';
  successMsg = '';
  mechanics: Mechanic[] = [];

  readonly countryList = [
    'Costa Rica',
    'Guatemala',
    'El Salvador',
    'Honduras',
    'Nicaragua',
    'Panamá',
    'Belize',
    'México',
    'United States',
    'Canada',
    'Cuba',
    'Dominican Republic',
    'Puerto Rico',
    'Jamaica',
    'Haiti',
    'Trinidad and Tobago',
    'Colombia',
    'Venezuela',
    'Ecuador',
    'Perú',
    'Bolivia',
    'Chile',
    'Brasil',
    'Argentina',
    'Uruguay',
    'Paraguay',
    'Guyana',
    'Suriname',
    'Spain',
    'Portugal',
    'France',
    'Germany',
    'Italy',
    'United Kingdom',
    'Other',
  ];

  constructor(
    private userService: UserService,
    private mechanicService: MechanicService,
    public authService: AuthService,
    private ts: TranslationService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  ngOnInit(): void {
    this.mechanicService
      .getMechanics()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (m) => (this.mechanics = m.filter((x) => x.isActive)),
      });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.editId = +id;
      this.userService
        .getById(this.editId)
        .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
        .subscribe({
          next: (u) => {
            this.user = {
              username: u.username,
              password: '',
              fullName: u.fullName,
              email: u.email,
              role: u.role,
              mechanicId: u.mechanicId ?? null,
              country: u.country ?? '',
            };
            this.userActive = u.active;
          },
          error: () => (this.errorMsg = this.ts.t('users.error.load')),
        });
    }
  }

  save(): void {
    if (!this.user.username || (!this.isEdit && !this.user.password)) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }

    this.saving = true;
    this.errorMsg = '';

    if (this.isEdit) {
      const payload: any = {
        username: this.user.username,
        fullName: this.user.fullName,
        email: this.user.email,
        role: this.user.role,
        active: this.userActive,
        mechanicId:
          this.user.role === 'mechanic' ? (this.user.mechanicId ?? 0) : 0,
        country: this.user.country || null,
      };
      if (this.user.password) {
        payload.password = this.user.password;
      }
      this.userService
        .update(this.editId, payload)
        .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
        .subscribe({
          next: () => {
            this.saving = false;
            const slug = localStorage.getItem('tenant_slug');
            this.router.navigate([slug ? `/${slug}/users` : '/landing']);
          },
          error: (err) => {
            this.saving = false;
            this.errorMsg =
              err.error?.message || this.ts.t('common.updateError');
          },
        });
    } else {
      const payload: any = {
        ...this.user,
        active: this.userActive,
      };
      this.userService
        .create(payload)
        .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
        .subscribe({
          next: () => {
            this.saving = false;
            const slug = localStorage.getItem('tenant_slug');
            this.router.navigate([slug ? `/${slug}/users` : '/landing']);
          },
          error: (err) => {
            this.saving = false;
            this.errorMsg = err.error?.message || this.ts.t('users.error.add');
          },
        });
    }
  }
}

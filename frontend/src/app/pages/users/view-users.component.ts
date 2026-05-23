import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { UserService } from '../../services/user.service';
import { MechanicService } from '../../services/mechanic.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user';
import { Mechanic } from '../../models/mechanic';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-view-users',
  imports: [FormsModule, RouterModule, LocalDatePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>&#128101; {{ 'users.title' | translate }}</h1>
        <p>{{ 'users.count' | translate: { count: users.length } }}</p>
      </div>
      <div class="page-actions">
        <a routerLink="../users/add" class="btn btn-primary"
          >+ {{ 'users.add' | translate }}</a
        >
      </div>

      <div class="filter-bar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          [placeholder]="'users.search' | translate"
          class="search-input"
        />
      </div>

      @if (errorMsg) {
        <div class="error-message">{{ errorMsg }}</div>
      }
      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }

      @if (filteredUsers.length > 0) {
        <div class="inventory-table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>{{ 'users.fullName' | translate }}</th>
                <th>{{ 'users.username' | translate }}</th>
                <th>{{ 'users.email' | translate }}</th>
                <th>{{ 'users.role' | translate }}</th>
                <th>{{ 'common.status' | translate }}</th>
                <th>{{ 'users.createdAt' | translate }}</th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (u of filteredUsers; track u) {
                <tr>
                  <td>{{ u.fullName || '—' }}</td>
                  <td>{{ u.username }}</td>
                  <td>{{ u.email || '—' }}</td>
                  <td>
                    <span class="role-badge" [class]="'role-' + u.role">{{
                      getRoleLabel(u.role)
                    }}</span>
                  </td>
                  <td>
                    <span
                      class="status-badge"
                      [class.active]="u.active"
                      [class.inactive]="!u.active"
                    >
                      {{
                        u.active
                          ? ('common.active' | translate)
                          : ('common.inactive' | translate)
                      }}
                    </span>
                  </td>
                  <td>{{ u.createdAt | localDate: 'mediumDate' }}</td>
                  <td>
                    <div class="action-btns">
                      <button
                        class="btn btn-sm btn-outline"
                        (click)="openEdit(u)"
                        title="Edit"
                      >
                        &#9998;
                      </button>
                      <button
                        class="btn btn-sm btn-toggle"
                        [class.deactivate]="u.active"
                        [class.activate]="!u.active"
                        (click)="toggleActive(u)"
                        [title]="
                          u.active
                            ? ('users.deactivate' | translate)
                            : ('users.reactivate' | translate)
                        "
                      >
                        {{ u.active ? '&#10060;' : '&#9989;' }}
                      </button>
                      <button
                        class="btn btn-sm btn-danger"
                        (click)="confirmDelete(u)"
                        title="Delete"
                      >
                        &#128465;
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (filteredUsers.length === 0 && !errorMsg) {
        <div class="empty-state">
          <p>{{ 'users.empty' | translate }}</p>
        </div>
      }

      <!-- Edit Modal -->
      @if (editing) {
        <div class="modal-overlay" (click)="cancelEdit()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h3>{{ 'users.editTitle' | translate }}</h3>
            <div class="form-group">
              <label>{{ 'users.fullName' | translate }}</label>
              <input type="text" [(ngModel)]="editUser.fullName" />
            </div>
            <div class="form-group">
              <label>{{ 'users.username' | translate }}</label>
              <input type="text" [(ngModel)]="editUser.username" />
            </div>
            <div class="form-group">
              <label>{{ 'users.email' | translate }}</label>
              <input type="email" [(ngModel)]="editUser.email" />
            </div>
            <div class="form-group">
              <label>{{ 'users.role' | translate }}</label>
              <select [(ngModel)]="editUser.role">
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
            @if (editUser.role === 'mechanic') {
              <div class="form-group">
                <label>{{ 'users.linkedMechanic' | translate }}</label>
                <select [(ngModel)]="editUser.mechanicId">
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
            }
            <div class="form-group">
              <label>{{ 'users.newPassword' | translate }}</label>
              <input
                type="password"
                [(ngModel)]="editPassword"
                [placeholder]="'users.passwordHint' | translate"
              />
            </div>
            <div class="form-group">
              <label>{{ 'onboarding.country' | translate }}</label>
              <select [(ngModel)]="editUser.country" name="country">
                <option value="">— {{ 'onboarding.countryPlaceholder' | translate }} —</option>
                @for (c of countryList; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
            <div class="modal-actions">
              <button
                class="btn btn-primary"
                (click)="saveEdit()"
                [disabled]="savingEdit || !editUser.username"
              >
                {{
                  savingEdit
                    ? ('common.saving' | translate)
                    : ('common.save' | translate)
                }}
              </button>
              <button class="btn btn-outline" (click)="cancelEdit()">
                {{ 'common.cancel' | translate }}
              </button>
            </div>
            @if (editError) {
              <div class="error-message">{{ editError }}</div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .role-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: capitalize;
      }
      .role-admin {
        background: #e3d5ff;
        color: #5b21b6;
      }
      .role-super-admin {
        background: #fde8e8;
        color: #991b1b;
      }
      .role-supervisor {
        background: #d1ecf1;
        color: #0c5460;
      }
      .role-mechanic {
        background: #fff3cd;
        color: #856404;
      }

      .status-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
      }
      .status-badge.active {
        background: #d4edda;
        color: #155724;
      }
      .status-badge.inactive {
        background: #f8d7da;
        color: #721c24;
      }

      .action-btns {
        display: flex;
        gap: 6px;
      }
      .btn-toggle.deactivate {
        border-color: #dc3545;
        color: #dc3545;
      }
      .btn-toggle.activate {
        border-color: #28a745;
        color: #28a745;
      }
      .btn-danger {
        background: #dc3545;
        color: #fff;
        border: none;
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal-card {
        background: #fff;
        border-radius: 12px;
        padding: 28px;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
      }
      .modal-card h3 {
        margin: 0 0 20px;
        font-size: 1.2rem;
      }
      .form-group {
        margin-bottom: 14px;
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
      .modal-actions {
        display: flex;
        gap: 10px;
        margin-top: 18px;
      }
    `,
  ],
})
export class ViewUsersComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  users: User[] = [];
  searchTerm = '';
  errorMsg = '';
  successMsg = '';

  // Edit modal
  editing = false;
  editUser: any = {};
  editUserId = 0;
  editPassword = '';
  savingEdit = false;
  editError = '';
  mechanics: Mechanic[] = [];

  readonly countryList = [
    'Costa Rica', 'Guatemala', 'El Salvador', 'Honduras', 'Nicaragua', 'Panamá', 'Belize',
    'México', 'United States', 'Canada',
    'Cuba', 'Dominican Republic', 'Puerto Rico', 'Jamaica', 'Haiti', 'Trinidad and Tobago',
    'Colombia', 'Venezuela', 'Ecuador', 'Perú', 'Bolivia', 'Chile', 'Brasil', 'Argentina',
    'Uruguay', 'Paraguay', 'Guyana', 'Suriname',
    'Spain', 'Portugal', 'France', 'Germany', 'Italy', 'United Kingdom',
    'Other',
  ];

  constructor(
    private userService: UserService,
    private mechanicService: MechanicService,
    public authService: AuthService,
    public ts: TranslationService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.mechanicService
      .getMechanics()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (m) => (this.mechanics = m.filter((x) => x.isActive)),
      });
  }

  loadUsers(): void {
    this.userService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (u) => (this.users = u),
        error: () => (this.errorMsg = this.ts.t('users.error.load')),
      });
  }

  get filteredUsers(): User[] {
    if (!this.searchTerm) return this.users;
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term),
    );
  }

  getRoleLabel(role: string): string {
    const key = `users.role.${role}`;
    const t = this.ts.t(key);
    return t !== key ? t : role;
  }

  toggleActive(u: User): void {
    this.userService
      .update(u.id!, { active: !u.active })
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          u.active = !u.active;
          this.successMsg = this.ts.t('common.updateSuccess');
          setTimeout(() => (this.successMsg = ''), 3000);
        },
        error: () => (this.errorMsg = this.ts.t('common.updateError')),
      });
  }

  confirmDelete(u: User): void {
    if (!confirm(this.ts.t('users.confirmDelete'))) return;
    this.userService
      .delete(u.id!)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.users = this.users.filter((x) => x.id !== u.id);
          this.successMsg = this.ts.t('users.deleted');
          setTimeout(() => (this.successMsg = ''), 3000);
        },
        error: (err) =>
          (this.errorMsg =
            err.error?.message || this.ts.t('common.deleteError')),
      });
  }

  openEdit(u: User): void {
    this.editUserId = u.id!;
    this.editUser = { ...u };
    this.editPassword = '';
    this.editError = '';
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
  }

  saveEdit(): void {
    if (!this.editUser.username?.trim()) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.savingEdit = true;
    this.editError = '';
    const payload: any = {
      username: this.editUser.username,
      fullName: this.editUser.fullName,
      email: this.editUser.email,
      role: this.editUser.role,
      mechanicId:
        this.editUser.role === 'mechanic' ? (this.editUser.mechanicId ?? 0) : 0,
      country: this.editUser.country || null,
    };
    if (this.editPassword) {
      payload.password = this.editPassword;
    }
    this.userService
      .update(this.editUserId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.savingEdit = false;
          this.editing = false;
          this.loadUsers();
          this.successMsg = this.ts.t('common.updateSuccess');
          setTimeout(() => (this.successMsg = ''), 3000);
        },
        error: (err) => {
          this.savingEdit = false;
          this.editError =
            err.error?.message || this.ts.t('common.updateError');
        },
      });
  }
}

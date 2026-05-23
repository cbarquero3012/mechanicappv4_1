import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MechanicService } from '../../services/mechanic.service';
import { Mechanic, MechanicUserOption } from '../../models/mechanic';
import { TranslationService } from '../../services/translation.service';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-view-mechanics',
  imports: [FormsModule, RouterModule, LocalDatePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>&#128295; {{ 'mechanics.title' | translate }}</h1>
        <p>{{ 'mechanics.count' | translate: { count: mechanics.length } }}</p>
      </div>
      <div class="page-actions">
        <a routerLink="../mechanics/add" class="btn btn-primary"
          >+ {{ 'mechanics.add' | translate }}</a
        >
      </div>

      <div class="filter-bar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          [placeholder]="'mechanics.search' | translate"
          class="search-input"
        />
      </div>

      @if (errorMsg) {
        <div class="error-message">{{ errorMsg }}</div>
      }
      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }

      @if (filteredMechanics.length > 0) {
        <div class="inventory-table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>{{ 'common.name' | translate }}</th>
                <th>{{ 'mechanics.specialty' | translate }}</th>
                <th>{{ 'mechanics.hireDate' | translate }}</th>
                <th>{{ 'mechanics.linkedUser' | translate }}</th>
                <th>{{ 'common.status' | translate }}</th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (m of filteredMechanics; track m) {
                <tr>
                  @if (editingId !== m.id) {
                    <td>
                      <strong>{{ m.lastName }}, {{ m.firstName }}</strong>
                    </td>
                    <td>{{ m.specialty || '-' }}</td>
                    <td>
                      {{ m.hireDate ? (m.hireDate | localDate: 'mediumDate') : '-' }}
                    </td>
                    <td>
                      @if (m.linkedUsername) {
                        <span class="user-link-badge">
                          &#128100; {{ m.linkedUsername }}
                        </span>
                      }
                      @if (!m.linkedUsername) {
                        <span class="text-muted">—</span>
                      }
                    </td>
                    <td>
                      <span
                        class="status-badge"
                        [class.active]="m.isActive"
                        [class.inactive]="!m.isActive"
                      >
                        {{
                          m.isActive
                            ? ('common.active' | translate)
                            : ('common.inactive' | translate)
                        }}
                      </span>
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
                        (click)="deleteMechanic(m.id!)"
                      >
                        &#128465;
                      </button>
                    </td>
                  }
                  @if (editingId === m.id) {
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.firstName"
                        class="inline-edit-input"
                        placeholder="First"
                        style="width:45%;margin-right:4px"
                      />
                      <input
                        type="text"
                        [(ngModel)]="editItem.lastName"
                        class="inline-edit-input"
                        placeholder="Last"
                        style="width:45%"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.specialty"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        [(ngModel)]="editItem.hireDate"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>
                      <select
                        [(ngModel)]="editItem.linkedUserId"
                        class="inline-edit-input"
                      >
                        <option [ngValue]="null">—</option>
                        @for (u of getEditUserOptions(); track u) {
                          <option [ngValue]="u.id">
                            {{ u.fullName || u.username }}
                          </option>
                        }
                      </select>
                    </td>
                    <td>
                      <label
                        ><input
                          type="checkbox"
                          [(ngModel)]="editItem.isActive"
                        />
                        {{ 'common.active' | translate }}</label
                      >
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

      @if (filteredMechanics.length === 0 && !loading) {
        <div class="empty-state">
          <p>
            {{ 'mechanics.empty' | translate }}
            <a routerLink="../mechanics/add">{{
              'mechanics.addFirst' | translate
            }}</a
            >.
          </p>
        </div>
      }
      @if (loading) {
        <div class="loading">
          {{ 'mechanics.loading' | translate }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      .user-link-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        background: #d1ecf1;
        color: #0c5460;
      }
      .text-muted {
        color: #999;
      }
    `,
  ],
})
export class ViewMechanicsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  mechanics: Mechanic[] = [];
  loading = true;
  searchTerm = '';
  editingId: number | null = null;
  editItem: Mechanic = { firstName: '', lastName: '', isActive: true };
  errorMsg = '';
  successMsg = '';
  availableUsers: MechanicUserOption[] = [];

  get filteredMechanics(): Mechanic[] {
    if (!this.searchTerm) return this.mechanics;
    const term = this.searchTerm.toLowerCase();
    return this.mechanics.filter(
      (m) =>
        m.firstName.toLowerCase().includes(term) ||
        m.lastName.toLowerCase().includes(term) ||
        (m.specialty || '').toLowerCase().includes(term) ||
        (m.linkedUsername || '').toLowerCase().includes(term),
    );
  }

  constructor(
    private mechanicService: MechanicService,
    public ts: TranslationService,
  ) {}

  ngOnInit(): void {
    this.loadMechanics();
    this.loadAvailableUsers();
  }

  loadMechanics(): void {
    this.loading = true;
    this.mechanicService
      .getMechanics()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (data) => {
          this.mechanics = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  loadAvailableUsers(): void {
    this.mechanicService
      .getAvailableUsers()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (users) => (this.availableUsers = users),
      });
  }

  /** Returns users available for linking: those not linked to any mechanic, or currently linked to this mechanic */
  getEditUserOptions(): MechanicUserOption[] {
    return this.availableUsers.filter(
      (u) => !u.mechanicId || u.mechanicId === this.editItem.id,
    );
  }

  startEdit(m: Mechanic): void {
    this.editingId = m.id!;
    this.editItem = { ...m };
    this.clearMessages();
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    this.mechanicService
      .updateMechanic(this.editItem)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.editingId = null;
          this.successMsg = this.ts.t('common.updateSuccess');
          this.loadMechanics();
          this.loadAvailableUsers();
        },
        error: () => {
          this.errorMsg = this.ts.t('common.updateError');
        },
      });
  }

  deleteMechanic(id: number): void {
    if (confirm(this.ts.t('mechanics.confirmDelete'))) {
      this.clearMessages();
      this.mechanicService
        .deleteMechanic(id)
        .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
        .subscribe({
          next: () => this.loadMechanics(),
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

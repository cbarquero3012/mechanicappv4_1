import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer';
import { TranslationService } from '../../services/translation.service';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-view-customers',
  imports: [FormsModule, RouterModule, LocalDatePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>&#128100; {{ 'customers.title' | translate }}</h1>
        <p>{{ 'customers.count' | translate: { count: customers.length } }}</p>
      </div>
      <div class="page-actions">
        <a routerLink="../customers/add" class="btn btn-primary"
          >+ {{ 'customers.add' | translate }}</a
        >
      </div>

      <div class="filter-bar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          [placeholder]="'customers.search' | translate"
          class="search-input"
        />
      </div>

      @if (errorMsg) {
        <div class="error-message">{{ errorMsg }}</div>
      }
      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }

      @if (filteredCustomers.length > 0) {
        <div class="inventory-table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>{{ 'common.name' | translate }}</th>
                <th>{{ 'customers.idClient' | translate }}</th>
                <th>{{ 'customers.email' | translate }}</th>
                <th>{{ 'customers.phone' | translate }}</th>
                <th>{{ 'customers.address' | translate }}</th>
                <th>{{ 'customers.since' | translate }}</th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filteredCustomers; track c) {
                <tr>
                  @if (editingId !== c.id) {
                    <td>
                      <strong>{{ c.lastName }}, {{ c.firstName }}</strong>
                    </td>
                    <td>{{ c.idClient || '-' }}</td>
                    <td>{{ c.email || '-' }}</td>
                    <td>{{ c.phoneNumber }}</td>
                    <td>{{ c.address || '-' }}</td>
                    <td>{{ c.createdAt | localDate: 'shortDate' }}</td>
                    <td>
                      <button
                        class="btn-icon"
                        (click)="startEdit(c)"
                        title="Edit"
                      >
                        &#9998;
                      </button>
                      <a
                        [routerLink]="['../customers', c.id]"
                        class="btn-icon"
                        title="View"
                        >&#128269;</a
                      >
                      <button
                        class="btn-icon btn-delete"
                        (click)="deleteCustomer(c.id!)"
                      >
                        &#128465;
                      </button>
                    </td>
                  }
                  @if (editingId === c.id) {
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
                        [(ngModel)]="editItem.idClient"
                        class="inline-edit-input"
                        placeholder="ID"
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        [(ngModel)]="editItem.email"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.phoneNumber"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.address"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>{{ c.createdAt | localDate: 'shortDate' }}</td>
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

      @if (filteredCustomers.length === 0 && !loading) {
        <div class="empty-state">
          <p>
            {{ 'customers.empty' | translate }}
            <a routerLink="../customers/add">{{
              'customers.addFirst' | translate
            }}</a
            >.
          </p>
        </div>
      }
      @if (loading) {
        <div class="loading">
          {{ 'customers.loading' | translate }}
        </div>
      }
    </div>
  `,
})
export class ViewCustomersComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  customers: Customer[] = [];
  loading = true;
  searchTerm = '';
  editingId: number | null = null;
  editItem: Customer = { firstName: '', lastName: '', phoneNumber: '' };
  errorMsg = '';
  successMsg = '';

  get filteredCustomers(): Customer[] {
    if (!this.searchTerm) return this.customers;
    const term = this.searchTerm.toLowerCase();
    return this.customers.filter(
      (c) =>
        c.firstName.toLowerCase().includes(term) ||
        c.lastName.toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term) ||
        c.phoneNumber.includes(term) ||
        (c.idClient || '').toLowerCase().includes(term),
    );
  }

  constructor(
    private customerService: CustomerService,
    public ts: TranslationService,
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.customerService
      .getCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (data) => {
          this.customers = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  startEdit(c: Customer): void {
    this.editingId = c.id!;
    this.editItem = { ...c };
    this.clearMessages();
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    this.customerService
      .updateCustomer(this.editItem)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.editingId = null;
          this.successMsg = this.ts.t('common.updateSuccess');
          this.loadCustomers();
        },
        error: () => {
          this.errorMsg = this.ts.t('common.updateError');
        },
      });
  }

  deleteCustomer(id: number): void {
    if (confirm(this.ts.t('customers.confirmDelete'))) {
      this.clearMessages();
      this.customerService
        .deleteCustomer(id)
        .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
        .subscribe({
          next: () => this.loadCustomers(),
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

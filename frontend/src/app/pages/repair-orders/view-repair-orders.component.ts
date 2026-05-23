import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RepairOrderService } from '../../services/repair-order.service';
import { RepairOrder } from '../../models/repair-order';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { DecimalPipe } from '@angular/common';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-view-repair-orders',
  imports: [
    FormsModule,
    RouterModule,
    LocalDatePipe,
    DecimalPipe,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>&#128736; {{ 'orders.title' | translate }}</h1>
        <p>{{ 'orders.count' | translate: { count: orders.length } }}</p>
      </div>
      <div class="page-actions">
        <a routerLink="../repair-orders/add" class="btn btn-primary"
          >+ {{ 'orders.new' | translate }}</a
        >
      </div>

      <div class="filter-bar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          [placeholder]="'orders.search' | translate"
          class="search-input"
        />
        <select [(ngModel)]="filterStatus" class="filter-select">
          <option value="">{{ 'orders.allStatuses' | translate }}</option>
          <option value="Pending">{{ 'status.pending' | translate }}</option>
          <option value="In Progress">
            {{ 'status.inProgress' | translate }}
          </option>
          <option value="Completed">
            {{ 'status.completed' | translate }}
          </option>
          <option value="Cancelled">
            {{ 'status.cancelled' | translate }}
          </option>
        </select>
      </div>

      @if (errorMsg) {
        <div class="error-message">{{ errorMsg }}</div>
      }
      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }

      @if (filteredOrders.length > 0) {
        <div class="inventory-table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ 'orders.vehicle' | translate }}</th>
                <th>{{ 'orders.client' | translate }}</th>
                <th>{{ 'orders.plate' | translate }}</th>
                <th>{{ 'orders.date' | translate }}</th>
                <th>{{ 'common.status' | translate }}</th>
                @if (authService.canSeePrices) {
                  <th>{{ 'orders.total' | translate }}</th>
                }
                <th>{{ 'orders.notes' | translate }}</th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (o of filteredOrders; track o) {
                <tr>
                  @if (editingId !== o.id) {
                    <td>{{ o.id }}</td>
                    <td>{{ o.carInfo || 'N/A' }}</td>
                    <td>{{ o.customerName || '-' }}</td>
                    <td>{{ o.licensePlate || '-' }}</td>
                    <td>{{ o.orderDate | localDate: 'short' }}</td>
                    <td>
                      <span
                        class="order-status"
                        [class.status-pending]="o.status === 'Pending'"
                        [class.status-progress]="o.status === 'In Progress'"
                        [class.status-completed]="o.status === 'Completed'"
                        [class.status-cancelled]="o.status === 'Cancelled'"
                      >
                        {{ getStatusLabel(o.status) }}
                      </span>
                    </td>
                    @if (authService.canSeePrices) {
                      <td>
                        {{ o.currencySymbol || '₡'
                        }}{{ o.totalCost | number: '1.2-2' }}
                      </td>
                    }
                    <td class="notes-cell" [title]="o.notes || ''">
                      {{ o.notes || '-' }}
                    </td>
                    <td>
                      @if (authService.isAdmin) {
                        <button
                          class="btn-icon"
                          (click)="startEdit(o)"
                          title="Edit"
                        >
                          &#9998;
                        </button>
                      }
                      <a
                        class="btn-icon"
                        [routerLink]="['../repair-orders', o.id]"
                        title="View Details"
                        >&#128269;</a
                      >
                      <button
                        class="btn-icon btn-delete"
                        (click)="deleteOrder(o.id!)"
                      >
                        &#128465;
                      </button>
                    </td>
                  }
                  @if (editingId === o.id) {
                    <td>{{ o.id }}</td>
                    <td>{{ o.carInfo || 'N/A' }}</td>
                    <td>{{ o.customerName || '-' }}</td>
                    <td>{{ o.licensePlate || '-' }}</td>
                    <td>{{ o.orderDate | localDate: 'short' }}</td>
                    <td>
                      <select
                        [(ngModel)]="editItem.status"
                        class="inline-edit-input"
                      >
                        <option value="Pending">
                          {{ 'status.pending' | translate }}
                        </option>
                        <option value="In Progress">
                          {{ 'status.inProgress' | translate }}
                        </option>
                        <option value="Completed">
                          {{ 'status.completed' | translate }}
                        </option>
                        <option value="Cancelled">
                          {{ 'status.cancelled' | translate }}
                        </option>
                      </select>
                    </td>
                    @if (authService.canSeePrices) {
                      <td>
                        {{ o.currencySymbol || '₡'
                        }}{{ o.totalCost | number: '1.2-2' }}
                      </td>
                    }
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.notes"
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

      @if (filteredOrders.length === 0 && !loading) {
        <div class="empty-state">
          <p>
            {{ 'orders.empty' | translate }}
            <a routerLink="../repair-orders/add">{{
              'orders.createFirst' | translate
            }}</a
            >.
          </p>
        </div>
      }
      @if (loading) {
        <div class="loading">
          {{ 'orders.loading' | translate }}
        </div>
      }
    </div>
  `,
})
export class ViewRepairOrdersComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  orders: RepairOrder[] = [];
  loading = true;
  searchTerm = '';
  filterStatus = '';
  filterClient = '';
  filterPlate = '';
  editingId: number | null = null;
  editItem: RepairOrder = { status: 'Pending', totalCost: 0 };
  errorMsg = '';
  successMsg = '';

  get filteredOrders(): RepairOrder[] {
    return this.orders.filter((o) => {
      const matchSearch =
        !this.searchTerm ||
        (o.carInfo || '')
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        (o.mechanicName || '')
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        (o.notes || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (o.customerName || '')
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        (o.licensePlate || '')
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.filterStatus || o.status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  constructor(
    private orderService: RepairOrderService,
    public ts: TranslationService,
    private toast: ToastService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService
      .getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (data) => {
          this.orders = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  startEdit(o: RepairOrder): void {
    this.editingId = o.id!;
    this.editItem = { ...o };
    this.clearMessages();
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    if (!this.editItem.status?.trim()) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.orderService
      .updateOrder(this.editItem)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.editingId = null;
          this.successMsg = this.ts.t('common.updateSuccess');
          this.loadOrders();
        },
        error: () => {
          this.errorMsg = this.ts.t('common.updateError');
        },
      });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Pending: this.ts.t('status.pending'),
      'In Progress': this.ts.t('status.inProgress'),
      Completed: this.ts.t('status.completed'),
      Cancelled: this.ts.t('status.cancelled'),
    };
    return map[status] || status;
  }

  deleteOrder(id: number): void {
    if (!confirm(this.ts.t('orders.confirmDelete'))) return;
    this.clearMessages();
    this.orderService
      .deleteOrder(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => this.loadOrders(),
        error: () => {
          this.errorMsg = this.ts.t('common.deleteError');
        },
      });
  }

  private clearMessages(): void {
    this.errorMsg = '';
    this.successMsg = '';
  }
}

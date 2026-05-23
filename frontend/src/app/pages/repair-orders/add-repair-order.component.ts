import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RepairOrderService } from '../../services/repair-order.service';
import { DetailCarService } from '../../services/detail-car.service';
import { MechanicService } from '../../services/mechanic.service';
import { InventoryService } from '../../services/inventory.service';
import { RepairOrder } from '../../models/repair-order';
import { DetailCar } from '../../models/detail-car';
import { Mechanic } from '../../models/mechanic';
import { MechanicService as MechanicServiceModel } from '../../models/mechanic-service';
import { CurrencyService } from '../../services/currency.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { forkJoin } from 'rxjs';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-add-repair-order',
  imports: [FormsModule, RouterModule, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>+ {{ 'orders.addTitle' | translate }}</h1>
        <p>{{ 'orders.addSubtitle' | translate }}</p>
      </div>
      <div class="page-actions">
        <a [routerLink]="'/' + slug + '/repair-orders'" class="btn btn-outline"
          >&larr; {{ 'orders.viewOrders' | translate }}</a
        >
      </div>

      <form (ngSubmit)="onSubmit()" #orderForm="ngForm" class="inventory-form">
        <div class="form-row">
          <div class="form-group">
            <label for="detailCarId"
              >{{ 'orders.vehicle' | translate }} *</label
            >
            <select
              id="detailCarId"
              [(ngModel)]="order.detailCarId"
              name="detailCarId"
              required
            >
              <option [ngValue]="undefined">
                -- {{ 'orders.selectVehicle' | translate }} --
              </option>
              @for (d of detailCars; track d) {
                <option [ngValue]="d.id">
                  {{ d.brand }} {{ d.model }} ({{ d.year }}) -
                  {{ d.customerName || 'N/A' }} [{{ d.vin }}]
                </option>
              }
            </select>
            @if (detailCars.length === 0) {
              <small class="field-hint"
                >{{ 'orders.noVehicles' | translate }}
                <a [routerLink]="'/' + slug + '/cars/add'">{{
                  'orders.addCarFirst' | translate
                }}</a
                >.</small
              >
            }
          </div>
          <div class="form-group">
            <label for="mechanicId">{{
              'orders.assignMechanic' | translate
            }}</label>
            <select
              id="mechanicId"
              [(ngModel)]="order.mechanicId"
              name="mechanicId"
            >
              <option [ngValue]="undefined">
                -- {{ 'orders.unassigned' | translate }} --
              </option>
              @for (m of activeMechanics; track m) {
                <option [ngValue]="m.id">
                  {{ m.firstName }} {{ m.lastName
                  }}{{ m.specialty ? ' (' + m.specialty + ')' : '' }}
                </option>
              }
            </select>
            @if (activeMechanics.length === 0) {
              <small class="field-hint"
                >{{ 'orders.noMechanics' | translate }}
                <a [routerLink]="'/' + slug + '/mechanics/add'">{{
                  'orders.addMechanicFirst' | translate
                }}</a
                >.</small
              >
            }
          </div>
        </div>

        <!-- Services selection -->
        <div class="form-row">
          <div class="form-group full-width">
            <label>{{ 'orders.selectServices' | translate }}</label>
            <div class="order-select-list">
              @for (s of activeServices; track s) {
                <div
                  class="order-select-item"
                  [class.selected]="isServiceSelected(s.id!)"
                  (click)="toggleService(s.id!)"
                >
                  <input
                    type="checkbox"
                    [checked]="isServiceSelected(s.id!)"
                    (click)="$event.stopPropagation()"
                    (change)="toggleService(s.id!)"
                  />
                  <span class="order-badge">{{ s.category }}</span>
                  <span class="order-car">{{ s.name }}</span>
                  @if (authService.canSeePrices) {
                    <span class="order-cost">
                      {{ s.currencySymbol || currSymbol
                      }}{{ s.basePrice | number: '1.2-2' }}
                    </span>
                  }
                </div>
              }
              @if (activeServices.length === 0) {
                <div class="field-hint" style="padding: 8px;">
                  {{ 'orders.noServices' | translate }}
                  <a [routerLink]="'/' + slug + '/inventory/services/add'">{{
                    'orders.addServiceFirst' | translate
                  }}</a
                  >.
                </div>
              }
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="status">{{ 'common.status' | translate }}</label>
            <select id="status" [(ngModel)]="order.status" name="status">
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
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label for="notes">{{ 'orders.notes' | translate }}</label>
            <textarea
              id="notes"
              [(ngModel)]="order.notes"
              name="notes"
              rows="4"
              [placeholder]="'orders.notesPlaceholder' | translate"
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="!orderForm.valid"
        >
          {{ 'orders.create' | translate }}
        </button>
      </form>

      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }
      @if (errorMsg) {
        <div class="error-message">{{ errorMsg }}</div>
      }
    </div>
  `,
  styles: [
    `
      .order-select-list {
        max-height: 260px;
        overflow-y: auto;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: var(--card-bg, #fff);
      }
      .order-select-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background 0.15s;
        font-size: 0.9rem;
      }
      .order-select-item:last-child {
        border-bottom: none;
      }
      .order-select-item:hover {
        background: rgba(13, 110, 253, 0.05);
      }
      .order-select-item.selected {
        background: rgba(13, 110, 253, 0.1);
        border-left: 3px solid #0d6efd;
      }
      .order-select-item input[type='checkbox'] {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
      }
      .order-badge {
        font-weight: 600;
        color: #0d6efd;
        min-width: 60px;
        font-size: 0.82em;
      }
      .order-car {
        flex: 1;
      }
      .order-cost {
        font-weight: 600;
        white-space: nowrap;
      }
    `,
  ],
})
export class AddRepairOrderComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  order: RepairOrder = { status: 'Pending', totalCost: 0 };
  detailCars: DetailCar[] = [];
  mechanics: Mechanic[] = [];
  services: MechanicServiceModel[] = [];
  selectedServiceIds: number[] = [];
  successMsg = '';
  errorMsg = '';
  currSymbol = '₡';

  get activeMechanics(): Mechanic[] {
    const active = this.mechanics.filter((m) => m.isActive);
    // Mechanic-role users can only assign themselves
    if (this.authService.isMechanic && this.authService.mechanicId) {
      return active.filter((m) => m.id === this.authService.mechanicId);
    }
    return active;
  }

  get activeServices(): MechanicServiceModel[] {
    return this.services.filter((s) => s.isActive);
  }

  constructor(
    private orderService: RepairOrderService,
    private detailCarService: DetailCarService,
    private mechanicService: MechanicService,
    private inventoryService: InventoryService,
    private currencyService: CurrencyService,
    public ts: TranslationService,
    public authService: AuthService,
    private toast: ToastService,
    private router: Router,
  ) {}

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  ngOnInit(): void {
    this.detailCarService
      .getDetailCars()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((data) => (this.detailCars = data));
    this.mechanicService
      .getMechanics()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((data) => {
        this.mechanics = data;
        // Auto-assign mechanic for mechanic-role users
        if (this.authService.isMechanic && this.authService.mechanicId) {
          this.order.mechanicId = this.authService.mechanicId;
        }
      });
    this.inventoryService
      .getServices()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((data) => (this.services = data));
    this.currencyService
      .getDefaultSymbol()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((s) => (this.currSymbol = s));
  }

  isServiceSelected(serviceId: number): boolean {
    return this.selectedServiceIds.includes(serviceId);
  }

  toggleService(serviceId: number): void {
    const idx = this.selectedServiceIds.indexOf(serviceId);
    if (idx >= 0) {
      this.selectedServiceIds.splice(idx, 1);
    } else {
      this.selectedServiceIds.push(serviceId);
    }
  }

  onSubmit(): void {
    this.errorMsg = '';
    if (!this.order.detailCarId) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.orderService
      .addOrder(this.order)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (res: any) => {
          const newOrderId = res?.id;
          if (!newOrderId || this.selectedServiceIds.length === 0) {
            this.showSuccess();
            return;
          }
          // Link selected services to the new order
          const selectedServices = this.services.filter((s) =>
            this.selectedServiceIds.includes(s.id!),
          );
          const calls = selectedServices.map((s) =>
            this.orderService.addOrderService({
              repairOrderId: newOrderId,
              serviceId: s.id!,
              quantity: 1,
              unitPrice: s.basePrice,
            }),
          );
          forkJoin(calls)
            .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
            .subscribe({
              next: () => this.showSuccess(),
              error: () => {
                this.errorMsg = this.ts.t('orders.error.create');
              },
            });
        },
        error: () => {
          this.errorMsg = this.ts.t('orders.error.create');
        },
      });
  }

  private showSuccess(): void {
    this.successMsg = this.ts.t('orders.success.create');
    this.order = { status: 'Pending', totalCost: 0 };
    this.selectedServiceIds = [];
    setTimeout(() => (this.successMsg = ''), 3000);
  }
}

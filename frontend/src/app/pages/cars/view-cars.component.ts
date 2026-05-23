import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DetailCarService } from '../../services/detail-car.service';
import { CustomerService } from '../../services/customer.service';
import { DetailCar } from '../../models/detail-car';
import { Customer } from '../../models/customer';
import { TranslationService } from '../../services/translation.service';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-view-cars',
  imports: [FormsModule, RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>{{ 'cars.title' | translate }}</h1>
        <p>{{ 'cars.showing' | translate: { count: detailCars.length } }}</p>
      </div>
      <div class="page-actions">
        <a routerLink="../cars/add" class="btn btn-primary"
          >+ {{ 'cars.addNew' | translate }}</a
        >
      </div>

      <div class="filter-bar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          [placeholder]="'common.search' | translate"
          class="search-input"
        />
      </div>

      @if (errorMessage) {
        <div class="error-message">{{ errorMessage }}</div>
      }
      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }

      @if (filteredCars.length > 0) {
        <div class="inventory-table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ 'cars.brand' | translate }}</th>
                <th>{{ 'cars.model' | translate }}</th>
                <th>{{ 'cars.year' | translate }}</th>
                <th>{{ 'cars.vin' | translate }}</th>
                <th>{{ 'cars.licensePlate' | translate }}</th>
                <th>{{ 'cars.mileage' | translate }}</th>
                <th>{{ 'cars.fuel' | translate }}</th>
                <th>{{ 'cars.typeCar' | translate }}</th>
                <th>{{ 'cars.transmission' | translate }}</th>
                <th>{{ 'cars.customer' | translate }}</th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (d of filteredCars; track d) {
                <tr>
                  @if (editingId !== d.id) {
                    <td>{{ d.id }}</td>
                    <td>{{ d.brand }}</td>
                    <td>{{ d.model }}</td>
                    <td>{{ d.year }}</td>
                    <td>{{ d.vin }}</td>
                    <td>{{ d.licensePlate || '-' }}</td>
                    <td>{{ d.mileage ?? 0 }}</td>
                    <td>{{ d.fuel }}</td>
                    <td>{{ d.typeCar }}</td>
                    <td>{{ d.transmissionType }}</td>
                    <td>{{ d.customerName || '-' }}</td>
                    <td>
                      <button
                        class="btn-icon"
                        (click)="startEdit(d)"
                        title="Edit"
                      >
                        &#9998;
                      </button>
                      <button
                        class="btn-icon btn-delete"
                        (click)="deleteDetail(d.id!)"
                      >
                        &#128465;
                      </button>
                    </td>
                  }
                  @if (editingId === d.id) {
                    <td>{{ d.id }}</td>
                    <td>{{ d.brand }}</td>
                    <td>{{ d.model }}</td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="editItem.year"
                        class="inline-edit-input"
                        style="width:70px"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.vin"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.licensePlate"
                        class="inline-edit-input"
                        maxlength="20"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        [(ngModel)]="editItem.mileage"
                        class="inline-edit-input"
                        min="0"
                        style="width:90px"
                      />
                    </td>
                    <td>
                      <select
                        [(ngModel)]="editItem.fuel"
                        class="inline-edit-input"
                      >
                        <option value="Gasoline">
                          {{ 'cars.fuel.gasoline' | translate }}
                        </option>
                        <option value="Diesel">
                          {{ 'cars.fuel.diesel' | translate }}
                        </option>
                        <option value="Electric">
                          {{ 'cars.fuel.electric' | translate }}
                        </option>
                        <option value="Hybrid">
                          {{ 'cars.fuel.hybrid' | translate }}
                        </option>
                        <option value="LPG">
                          {{ 'cars.fuel.lpg' | translate }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        [(ngModel)]="editItem.typeCar"
                        class="inline-edit-input"
                      />
                    </td>
                    <td>
                      <select
                        [(ngModel)]="editItem.transmissionType"
                        class="inline-edit-input"
                      >
                        <option value="Automatic">
                          {{ 'cars.trans.automatic' | translate }}
                        </option>
                        <option value="Manual">
                          {{ 'cars.trans.manual' | translate }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <select
                        [(ngModel)]="editItem.customerId"
                        class="inline-edit-input"
                      >
                        <option [ngValue]="null">-</option>
                        @for (c of customers; track c) {
                          <option [ngValue]="c.id">
                            {{ c.firstName }} {{ c.lastName }}
                          </option>
                        }
                      </select>
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

      @if (filteredCars.length === 0 && !errorMessage) {
        <div class="empty-state">
          <p>
            {{ 'cars.empty' | translate }}
            <a routerLink="../cars/add">{{ 'cars.addNow' | translate }}</a>
          </p>
        </div>
      }
    </div>
  `,
})
export class ViewCarsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  detailCars: DetailCar[] = [];
  customers: Customer[] = [];
  errorMessage = '';
  successMsg = '';
  searchTerm = '';
  editingId: number | null = null;
  editItem: DetailCar = {
    carModelId: 0,
    vin: '',
    fuel: '',
    year: 0,
    typeCar: '',
    transmissionType: '',
    licensePlate: '',
    mileage: 0,
  };

  get filteredCars(): DetailCar[] {
    if (!this.searchTerm) return this.detailCars;
    const term = this.searchTerm.toLowerCase();
    return this.detailCars.filter(
      (d) =>
        (d.brand || '').toLowerCase().includes(term) ||
        (d.model || '').toLowerCase().includes(term) ||
        (d.vin || '').toLowerCase().includes(term) ||
        (d.licensePlate || '').toLowerCase().includes(term) ||
        (d.customerName || '').toLowerCase().includes(term) ||
        String(d.year).includes(term),
    );
  }

  constructor(
    private detailCarService: DetailCarService,
    private customerService: CustomerService,
    public ts: TranslationService,
  ) {}

  ngOnInit(): void {
    this.loadDetails();
    this.customerService
      .getCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((c) => (this.customers = c));
  }

  loadDetails(): void {
    this.detailCarService
      .getDetailCars()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (data) => {
          this.detailCars = data;
          this.errorMessage = '';
        },
        error: () => {
          this.errorMessage = this.ts.t('cars.error.load');
        },
      });
  }

  startEdit(d: DetailCar): void {
    this.editingId = d.id!;
    this.editItem = { ...d };
    this.clearMessages();
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    this.detailCarService
      .updateDetailCar(this.editItem)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.editingId = null;
          this.successMsg = this.ts.t('common.updateSuccess');
          this.loadDetails();
        },
        error: () => {
          this.errorMessage = this.ts.t('common.updateError');
        },
      });
  }

  deleteDetail(id: number): void {
    if (!confirm(this.ts.t('cars.confirmDelete'))) return;
    this.clearMessages();
    this.detailCarService
      .deleteDetailCar(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => this.loadDetails(),
        error: () => {
          this.errorMessage = this.ts.t('cars.error.delete');
        },
      });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMsg = '';
  }
}

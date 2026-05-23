import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { RepairOrderService } from '../../services/repair-order.service';
import { InventoryService } from '../../services/inventory.service';
import { RepairOrderPhotoService } from '../../services/repair-order-photo.service';
import { AppSettingsService } from '../../services/app-settings.service';
import { AuthService } from '../../services/auth.service';
import { RepairOrder } from '../../models/repair-order';
import { RepairOrderServiceItem } from '../../models/repair-order-service';
import { RepairOrderPartItem } from '../../models/repair-order-part';
import { RepairOrderProductItem } from '../../models/repair-order-product';
import { RepairOrderPhoto } from '../../models/repair-order-photo';
import { MechanicService as MechanicServiceModel } from '../../models/mechanic-service';
import { Part } from '../../models/part';
import { Product } from '../../models/product';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';
import { CurrencyService } from '../../services/currency.service';
import { DecimalPipe } from '@angular/common';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-order-detail',
  imports: [
    FormsModule,
    RouterModule,
    LocalDatePipe,
    DecimalPipe,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (order) {
      <div class="module-page">
        <div class="page-header">
          <h1>
            &#128736; {{ 'orderDetail.title' | translate }} #{{ order.id }}
          </h1>
          <p>
            {{ order.carInfo || 'N/A' }} &mdash;
            {{ getStatusLabel(order.status) }}
          </p>
        </div>
        <div class="page-actions">
          <a
            [routerLink]="'/' + slug + '/repair-orders'"
            class="btn btn-outline"
            >&larr; {{ 'orders.viewOrders' | translate }}</a
          >
          @if (authService.canSeePrices) {
            <a
              [routerLink]="
                '/' + slug + '/repair-orders/' + order.id + '/invoice'
              "
              class="btn btn-primary"
              >&#128424; {{ 'orderDetail.invoice' | translate }}</a
            >
          }
          <button
            class="btn btn-whatsapp"
            (click)="shareViaWhatsApp()"
            [title]="'orderDetail.shareWhatsApp' | translate"
          >
            &#128172; {{ 'orderDetail.shareWhatsApp' | translate }}
          </button>
        </div>
        @if (orderErrorMsg) {
          <div class="error-message">{{ orderErrorMsg }}</div>
        }
        @if (orderSuccessMsg) {
          <div class="success-message">
            {{ orderSuccessMsg }}
          </div>
        }
        <div class="order-summary">
          <div class="summary-row">
            <span
              ><strong>{{ 'orders.mechanic' | translate }}:</strong>
              {{
                order.mechanicName || ('orders.unassigned' | translate)
              }}</span
            >
            <span
              ><strong>{{ 'orders.date' | translate }}:</strong>
              {{ order.orderDate | localDate: 'short' }}</span
            >
            @if (authService.canSeePrices) {
              <span class="total-badge"
                ><strong>{{ 'orders.total' | translate }}:</strong>
                {{ order.currencySymbol || currSymbol
                }}{{ order.totalCost | number: '1.2-2' }}</span
              >
            }
          </div>
          <div class="summary-row" style="margin-top: 12px; gap: 12px;">
            <label
              ><strong>{{ 'common.status' | translate }}:</strong>
              <select
                [(ngModel)]="order.status"
                class="inline-edit-input"
                style="margin-left: 6px;"
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
            </label>
            <button class="btn btn-primary btn-sm" (click)="saveOrderHeader()">
              {{ 'common.save' | translate }}
            </button>
          </div>
        </div>
        <!-- NOTES SECTION -->
        <div class="section-card">
          <h2>&#128221; {{ 'orderDetail.notes' | translate }}</h2>
          <!-- Initial note (locked) -->
          <div class="note-block">
            <div class="note-block-header">
              <span class="note-label">{{
                'orderDetail.initialNote' | translate
              }}</span>
              @if (authService.isAdmin) {
                <label class="note-edit-toggle">
                  <input
                    type="checkbox"
                    [(ngModel)]="editInitialNote"
                    name="editNoteToggle"
                  />
                  {{ 'orderDetail.allowEditNote' | translate }}
                </label>
              }
            </div>
            @if (!editInitialNote || !authService.isAdmin) {
              <div class="note-text">
                {{ order.notes || ('orderDetail.noInitialNote' | translate) }}
              </div>
              @if (!authService.isAdmin) {
                <p class="note-locked-hint">
                  &#128274; {{ 'orderDetail.noteLocked' | translate }}
                </p>
              }
            }
            @if (editInitialNote && authService.isAdmin) {
              <textarea
                [(ngModel)]="order.notes"
                name="initialNoteText"
                rows="3"
                class="note-textarea"
                [placeholder]="'orders.notesPlaceholder' | translate"
              ></textarea>
              <button
                class="btn btn-primary btn-sm"
                style="margin-top:6px"
                (click)="saveOrderHeader()"
              >
                {{ 'common.save' | translate }}
              </button>
            }
          </div>
          <!-- Append new note -->
          <div class="note-append-block">
            <span class="note-label">{{
              'orderDetail.addNote' | translate
            }}</span>
            <textarea
              [(ngModel)]="appendNoteText"
              name="appendNoteText"
              rows="2"
              class="note-textarea"
              [placeholder]="'orderDetail.newNotePlaceholder' | translate"
            ></textarea>
            <button
              class="btn btn-primary btn-sm"
              (click)="appendNote()"
              [disabled]="!appendNoteText.trim() || savingAppendNote"
            >
              {{
                savingAppendNote
                  ? ('common.saving' | translate)
                  : ('orderDetail.addNote' | translate)
              }}
            </button>
          </div>
        </div>
        <!-- SERVICES SECTION -->
        <div class="section-card">
          <h2>
            &#128295; {{ 'orderDetail.services' | translate }} ({{
              orderServices.length
            }})
          </h2>
          <div class="add-line-form">
            <select
              [(ngModel)]="newService.serviceId"
              name="serviceId"
              (change)="onServiceSelect()"
            >
              <option [ngValue]="0">
                -- {{ 'orderDetail.selectService' | translate }} --
              </option>
              @for (s of availableServices; track s) {
                <option [ngValue]="s.id">
                  {{ s.name }}
                  @if (authService.canSeePrices) {
                    ({{ s.currencySymbol || currSymbol
                    }}{{ s.basePrice | number: '1.2-2' }})
                  }
                </option>
              }
            </select>
            <input
              type="number"
              [(ngModel)]="newService.quantity"
              name="sQty"
              min="1"
              placeholder="Qty"
              class="qty-input"
            />
            @if (authService.canSeePrices) {
              <input
                type="number"
                [(ngModel)]="newService.unitPrice"
                name="sPrice"
                min="0"
                step="0.01"
                placeholder="Price"
                class="price-input"
              />
            }
            <button
              class="btn btn-primary btn-sm"
              (click)="addService()"
              [disabled]="!newService.serviceId"
            >
              +
            </button>
          </div>
          @if (orderServices.length > 0) {
            <table class="inventory-table">
              <thead>
                <tr>
                  <th>{{ 'orderDetail.serviceName' | translate }}</th>
                  <th>{{ 'common.category' | translate }}</th>
                  <th>{{ 'common.qty' | translate }}</th>
                  @if (authService.canSeePrices) {
                    <th>{{ 'common.price' | translate }}</th>
                  }
                  @if (authService.canSeePrices) {
                    <th>{{ 'orderDetail.subtotal' | translate }}</th>
                  }
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (s of orderServices; track s) {
                  <tr>
                    <td>{{ s.serviceName }}</td>
                    <td>{{ s.serviceCategory }}</td>
                    <td>{{ s.quantity }}</td>
                    @if (authService.canSeePrices) {
                      <td>
                        {{ s.currencySymbol || currSymbol
                        }}{{ s.unitPrice | number: '1.2-2' }}
                      </td>
                    }
                    @if (authService.canSeePrices) {
                      <td>
                        {{ s.currencySymbol || currSymbol
                        }}{{ s.quantity * s.unitPrice | number: '1.2-2' }}
                      </td>
                    }
                    <td>
                      <button
                        class="btn-icon btn-delete"
                        (click)="removeService(s.id!)"
                      >
                        &#128465;
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
          @if (orderServices.length === 0) {
            <p class="empty-hint">
              {{ 'orderDetail.noServices' | translate }}
            </p>
          }
        </div>
        <!-- PARTS SECTION -->
        <div class="section-card">
          <h2>
            &#9881; {{ 'orderDetail.parts' | translate }} ({{
              orderParts.length
            }})
          </h2>
          <div class="add-line-form">
            <select
              [(ngModel)]="newPart.partId"
              name="partId"
              (change)="onPartSelect()"
            >
              <option [ngValue]="0">
                -- {{ 'orderDetail.selectPart' | translate }} --
              </option>
              @for (p of availableParts; track p) {
                <option [ngValue]="p.id">
                  {{ p.name }} [{{ p.quantity }}
                  {{ 'orderDetail.inStock' | translate }}]
                  @if (authService.canSeePrices) {
                    ({{ p.currencySymbol || currSymbol
                    }}{{ p.sellPrice | number: '1.2-2' }})
                  }
                </option>
              }
            </select>
            <input
              type="number"
              [(ngModel)]="newPart.quantity"
              name="pQty"
              min="1"
              placeholder="Qty"
              class="qty-input"
            />
            @if (authService.canSeePrices) {
              <input
                type="number"
                [(ngModel)]="newPart.unitPrice"
                name="pPrice"
                min="0"
                step="0.01"
                placeholder="Price"
                class="price-input"
              />
            }
            <button
              class="btn btn-primary btn-sm"
              (click)="addPart()"
              [disabled]="!newPart.partId"
            >
              +
            </button>
          </div>
          @if (orderParts.length > 0) {
            <table class="inventory-table">
              <thead>
                <tr>
                  <th>{{ 'orderDetail.partName' | translate }}</th>
                  <th>{{ 'parts.partNumber' | translate }}</th>
                  <th>{{ 'common.qty' | translate }}</th>
                  @if (authService.canSeePrices) {
                    <th>{{ 'common.price' | translate }}</th>
                  }
                  @if (authService.canSeePrices) {
                    <th>{{ 'orderDetail.subtotal' | translate }}</th>
                  }
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (p of orderParts; track p) {
                  <tr>
                    <td>{{ p.partName }}</td>
                    <td>{{ p.partNumber || '-' }}</td>
                    <td>{{ p.quantity }}</td>
                    @if (authService.canSeePrices) {
                      <td>
                        {{ p.currencySymbol || currSymbol
                        }}{{ p.unitPrice | number: '1.2-2' }}
                      </td>
                    }
                    @if (authService.canSeePrices) {
                      <td>
                        {{ p.currencySymbol || currSymbol
                        }}{{ p.quantity * p.unitPrice | number: '1.2-2' }}
                      </td>
                    }
                    <td>
                      <button
                        class="btn-icon btn-delete"
                        (click)="removePart(p.id!)"
                      >
                        &#128465;
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
          @if (orderParts.length === 0) {
            <p class="empty-hint">
              {{ 'orderDetail.noParts' | translate }}
            </p>
          }
        </div>
        <!-- PRODUCTS SECTION -->
        <div class="section-card">
          <h2>
            &#128230; {{ 'orderDetail.products' | translate }} ({{
              orderProducts.length
            }})
          </h2>
          <div class="add-line-form">
            <select
              [(ngModel)]="newProduct.productId"
              name="productId"
              (change)="onProductSelect()"
            >
              <option [ngValue]="0">
                -- {{ 'orderDetail.selectProduct' | translate }} --
              </option>
              @for (pr of availableProducts; track pr) {
                <option [ngValue]="pr.id">
                  {{ pr.name }} [{{ pr.quantity }}
                  {{ 'orderDetail.inStock' | translate }}]
                  @if (authService.canSeePrices) {
                    ({{ pr.currencySymbol || currSymbol
                    }}{{ pr.sellPrice | number: '1.2-2' }})
                  }
                </option>
              }
            </select>
            <input
              type="number"
              [(ngModel)]="newProduct.quantity"
              name="prQty"
              min="1"
              placeholder="Qty"
              class="qty-input"
            />
            @if (authService.canSeePrices) {
              <input
                type="number"
                [(ngModel)]="newProduct.unitPrice"
                name="prPrice"
                min="0"
                step="0.01"
                placeholder="Price"
                class="price-input"
              />
            }
            <button
              class="btn btn-primary btn-sm"
              (click)="addProduct()"
              [disabled]="!newProduct.productId"
            >
              +
            </button>
          </div>
          @if (orderProducts.length > 0) {
            <table class="inventory-table">
              <thead>
                <tr>
                  <th>{{ 'orderDetail.productName' | translate }}</th>
                  <th>{{ 'inventory.products' | translate }}</th>
                  <th>{{ 'common.qty' | translate }}</th>
                  @if (authService.canSeePrices) {
                    <th>{{ 'common.price' | translate }}</th>
                  }
                  @if (authService.canSeePrices) {
                    <th>{{ 'orderDetail.subtotal' | translate }}</th>
                  }
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (pr of orderProducts; track pr) {
                  <tr>
                    <td>{{ pr.productName }}</td>
                    <td>{{ pr.productSKU || '-' }}</td>
                    <td>{{ pr.quantity }}</td>
                    @if (authService.canSeePrices) {
                      <td>
                        {{ pr.currencySymbol || currSymbol
                        }}{{ pr.unitPrice | number: '1.2-2' }}
                      </td>
                    }
                    @if (authService.canSeePrices) {
                      <td>
                        {{ pr.currencySymbol || currSymbol
                        }}{{ pr.quantity * pr.unitPrice | number: '1.2-2' }}
                      </td>
                    }
                    <td>
                      <button
                        class="btn-icon btn-delete"
                        (click)="removeProduct(pr.id!)"
                      >
                        &#128465;
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
          @if (orderProducts.length === 0) {
            <p class="empty-hint">
              {{ 'orderDetail.noProducts' | translate }}
            </p>
          }
        </div>
        <!-- PHOTOS SECTION -->
        <div class="section-card">
          <h2>
            &#128247; {{ 'orderDetail.photos' | translate }} ({{
              photos.length
            }})
          </h2>
          <div class="photo-upload-form">
            <input
              type="file"
              #fileInput
              (change)="onFilesSelected($event)"
              multiple
              accept=".jpg,.jpeg,image/jpeg"
              class="file-input"
            />
            <input
              type="text"
              [(ngModel)]="photoDescription"
              [placeholder]="'orderDetail.photoDescription' | translate"
              class="inline-edit-input"
              style="flex: 1;"
            />
            <button
              class="btn btn-primary btn-sm"
              (click)="uploadPhotos()"
              [disabled]="selectedFiles.length === 0 || uploading"
            >
              {{
                uploading
                  ? ('common.uploading' | translate)
                  : ('orderDetail.uploadPhotos' | translate)
              }}
            </button>
          </div>
          @if (photoErrorMsg) {
            <div class="error-message">
              {{ photoErrorMsg }}
            </div>
          }
          @if (photoSuccessMsg) {
            <div class="success-message">
              {{ photoSuccessMsg }}
            </div>
          }
          @if (photos.length > 0) {
            <div class="photo-gallery">
              @for (photo of photos; track photo) {
                <div class="photo-card">
                  <img
                    [src]="photo.filePath"
                    [alt]="photo.fileName"
                    class="photo-thumb"
                    (click)="openLightbox(photo)"
                  />
                  <div class="photo-info">
                    <span class="photo-name">{{ photo.fileName }}</span>
                    @if (photo.description) {
                      <span class="photo-desc">{{ photo.description }}</span>
                    }
                    <button
                      class="btn-icon btn-delete"
                      (click)="deletePhoto(photo.id!)"
                      [title]="'common.delete' | translate"
                    >
                      &#128465;
                    </button>
                  </div>
                </div>
              }
            </div>
          }
          @if (photos.length === 0) {
            <p class="empty-hint">
              {{ 'orderDetail.noPhotos' | translate }}
            </p>
          }
        </div>
        <!-- Lightbox -->
        @if (lightboxPhoto) {
          <div class="lightbox-overlay" (click)="closeLightbox()">
            <div class="lightbox-content" (click)="$event.stopPropagation()">
              <button class="lightbox-close" (click)="closeLightbox()">
                &times;
              </button>
              <img
                [src]="lightboxPhoto.filePath"
                [alt]="lightboxPhoto.fileName"
              />
              @if (lightboxPhoto.description) {
                <p>
                  {{ lightboxPhoto.description }}
                </p>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [
    '.order-summary { background: var(--card-bg, #f8f9fa); padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; } .summary-row { display: flex; gap: 24px; flex-wrap: wrap; align-items: center; } .total-badge { background: var(--primary, #0d6efd); color: #fff; padding: 4px 12px; border-radius: 4px; } .section-card { background: var(--card-bg, #fff); border: 1px solid var(--border, #dee2e6); border-radius: 8px; padding: 16px; margin-bottom: 20px; } .section-card h2 { margin: 0 0 12px; font-size: 1.1rem; } .add-line-form { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-wrap: wrap; } .add-line-form select { flex: 2; min-width: 200px; } .qty-input { width: 70px; } .price-input { width: 100px; } .btn-sm { padding: 6px 12px; font-size: 0.9rem; } .empty-hint { opacity: 0.6; font-style: italic; } .btn-whatsapp { background: #25D366; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.95rem; } .btn-whatsapp:hover { background: #1DA851; } .photo-upload-form { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-wrap: wrap; } .file-input { flex: 1; min-width: 200px; } .photo-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-top: 12px; } .photo-card { border: 1px solid var(--border, #dee2e6); border-radius: 8px; overflow: hidden; background: var(--card-bg, #fff); } .photo-thumb { width: 100%; height: 120px; object-fit: cover; cursor: pointer; transition: opacity 0.2s; } .photo-thumb:hover { opacity: 0.8; } .photo-info { padding: 8px; display: flex; flex-direction: column; gap: 4px; position: relative; } .photo-name { font-size: 0.8rem; word-break: break-all; opacity: 0.7; } .photo-desc { font-size: 0.85rem; } .photo-info .btn-delete { position: absolute; top: 4px; right: 4px; } .lightbox-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 9999; } .lightbox-content { position: relative; max-width: 90vw; max-height: 90vh; text-align: center; } .lightbox-content img { max-width: 100%; max-height: 80vh; border-radius: 8px; } .lightbox-content p { color: #fff; margin-top: 12px; font-size: 1rem; } .lightbox-close { position: absolute; top: -16px; right: -16px; background: #fff; border: none; font-size: 1.5rem; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; line-height: 1; } .note-block { margin-bottom: 4px; } .note-block-header { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; flex-wrap: wrap; } .note-label { font-weight: 600; font-size: 0.9rem; } .note-edit-toggle { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; cursor: pointer; color: var(--primary, #0d6efd); } .note-text { background: var(--input-bg, #f8f9fa); border: 1px solid var(--border, #dee2e6); border-radius: 6px; padding: 10px 12px; white-space: pre-wrap; word-break: break-word; font-size: 0.9rem; min-height: 48px; } .note-locked-hint { font-size: 0.78rem; opacity: 0.55; margin: 6px 0 0; } .note-textarea { width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid var(--border, #dee2e6); border-radius: 6px; font-size: 0.9rem; resize: vertical; background: var(--input-bg, #fff); } .note-append-block { margin-top: 16px; border-top: 1px solid var(--border, #dee2e6); padding-top: 14px; display: flex; flex-direction: column; gap: 8px; }',
  ],
})
export class OrderDetailComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  order!: RepairOrder;
  orderServices: RepairOrderServiceItem[] = [];
  orderParts: RepairOrderPartItem[] = [];
  orderProducts: RepairOrderProductItem[] = [];
  availableServices: MechanicServiceModel[] = [];
  availableParts: Part[] = [];
  availableProducts: Product[] = [];
  photos: RepairOrderPhoto[] = [];
  orderErrorMsg = '';
  orderSuccessMsg = '';
  photoErrorMsg = '';
  photoSuccessMsg = '';
  currSymbol = '₡';
  whatsAppPhone = '';

  /* Photo upload */
  selectedFiles: File[] = [];
  photoDescription = '';
  uploading = false;
  lightboxPhoto: RepairOrderPhoto | null = null;

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }

  /* Notes */
  editInitialNote = false;
  appendNoteText = '';
  savingAppendNote = false;

  newService: RepairOrderServiceItem = {
    repairOrderId: 0,
    serviceId: 0,
    quantity: 1,
    unitPrice: 0,
  };
  newPart: RepairOrderPartItem = {
    repairOrderId: 0,
    partId: 0,
    quantity: 1,
    unitPrice: 0,
  };
  newProduct: RepairOrderProductItem = {
    repairOrderId: 0,
    productId: 0,
    quantity: 1,
    unitPrice: 0,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private repairOrderService: RepairOrderService,
    private inventoryService: InventoryService,
    private photoService: RepairOrderPhotoService,
    private appSettings: AppSettingsService,
    private currencyService: CurrencyService,
    public ts: TranslationService,
    public authService: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      const slug = localStorage.getItem('tenant_slug');
      this.router.navigate([slug ? `/${slug}/repair-orders` : '/landing']);
      return;
    }
    this.newService.repairOrderId = id;
    this.newPart.repairOrderId = id;
    this.newProduct.repairOrderId = id;
    this.loadOrder(id);
    this.loadOrderServices(id);
    this.loadOrderParts(id);
    this.loadOrderProducts(id);
    this.loadPhotos(id);
    this.inventoryService
      .getServices()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((s) => (this.availableServices = s.filter((x) => x.isActive)));
    this.inventoryService
      .getParts()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((p) => (this.availableParts = p));
    this.inventoryService
      .getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((p) => (this.availableProducts = p));
    this.currencyService
      .getDefaultSymbol()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((s) => (this.currSymbol = s));
    this.whatsAppPhone =
      this.appSettings.current.whatsAppPhone ||
      this.appSettings.current.phone ||
      '';
  }

  loadOrder(id: number) {
    this.repairOrderService
      .getOrder(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((o) => (this.order = o));
  }
  loadOrderServices(id: number) {
    this.repairOrderService
      .getOrderServices(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((s) => (this.orderServices = s));
  }
  loadOrderParts(id: number) {
    this.repairOrderService
      .getOrderParts(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((p) => (this.orderParts = p));
  }
  loadOrderProducts(id: number) {
    this.repairOrderService
      .getOrderProducts(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((p) => (this.orderProducts = p));
  }

  onServiceSelect() {
    const svc = this.availableServices.find(
      (s) => s.id === this.newService.serviceId,
    );
    if (svc) this.newService.unitPrice = svc.basePrice;
  }

  onPartSelect() {
    const part = this.availableParts.find((p) => p.id === this.newPart.partId);
    if (part) this.newPart.unitPrice = part.sellPrice;
  }

  onProductSelect() {
    const prod = this.availableProducts.find(
      (p) => p.id === this.newProduct.productId,
    );
    if (prod) this.newProduct.unitPrice = prod.sellPrice;
  }

  addService() {
    if (!this.newService.serviceId || this.newService.quantity < 1) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.orderErrorMsg = '';
    this.repairOrderService
      .addOrderService(this.newService)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.toast.success(this.ts.t('orderDetail.itemAdded'));
          this.refreshAll();
          this.newService = {
            repairOrderId: this.order.id!,
            serviceId: 0,
            quantity: 1,
            unitPrice: 0,
          };
        },
        error: () => this.toast.error(this.ts.t('orderDetail.itemAddError')),
      });
  }

  addPart() {
    if (!this.newPart.partId || this.newPart.quantity < 1) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.orderErrorMsg = '';
    this.repairOrderService
      .addOrderPart(this.newPart)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.toast.success(this.ts.t('orderDetail.itemAdded'));
          this.refreshAll();
          this.newPart = {
            repairOrderId: this.order.id!,
            partId: 0,
            quantity: 1,
            unitPrice: 0,
          };
          this.inventoryService
            .getParts()
            .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
            .subscribe((p) => (this.availableParts = p));
        },
        error: () => this.toast.error(this.ts.t('orderDetail.itemAddError')),
      });
  }

  removeService(id: number) {
    this.repairOrderService
      .deleteOrderService(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe(() => this.refreshAll());
  }

  removePart(id: number) {
    this.repairOrderService
      .deleteOrderPart(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe(() => {
        this.refreshAll();
        this.inventoryService
          .getParts()
          .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
          .subscribe((p) => (this.availableParts = p));
      });
  }

  addProduct() {
    if (!this.newProduct.productId || this.newProduct.quantity < 1) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.orderErrorMsg = '';
    this.repairOrderService
      .addOrderProduct(this.newProduct)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.toast.success(this.ts.t('orderDetail.itemAdded'));
          this.refreshAll();
          this.newProduct = {
            repairOrderId: this.order.id!,
            productId: 0,
            quantity: 1,
            unitPrice: 0,
          };
          this.inventoryService
            .getProducts()
            .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
            .subscribe((p) => (this.availableProducts = p));
        },
        error: () => this.toast.error(this.ts.t('orderDetail.itemAddError')),
      });
  }

  removeProduct(id: number) {
    this.repairOrderService
      .deleteOrderProduct(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe(() => {
        this.refreshAll();
        this.inventoryService
          .getProducts()
          .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
          .subscribe((p) => (this.availableProducts = p));
      });
  }

  refreshAll() {
    if (!this.order?.id) return;
    this.loadOrder(this.order.id);
    this.loadOrderServices(this.order.id);
    this.loadOrderParts(this.order.id);
    this.loadOrderProducts(this.order.id);
    this.loadPhotos(this.order.id);
  }

  /* ── Photo methods ── */
  loadPhotos(id: number) {
    this.photoService
      .getPhotos(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((p) => (this.photos = p));
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const all = input.files ? Array.from(input.files) : [];
    // Only JPG/JPEG accepted. Show popup if any file has another format.
    const valid = all.filter((f) => this.photoService.isJpegFile(f));
    if (valid.length !== all.length) {
      this.toast.error(this.ts.t('orderDetail.photoFormatNotSupported'));
      input.value = '';
    }
    this.selectedFiles = valid;
  }

  uploadPhotos() {
    if (this.selectedFiles.length === 0) return;
    this.uploading = true;
    this.photoErrorMsg = '';
    this.photoSuccessMsg = '';
    this.photoService
      .uploadPhotos(this.order.id!, this.selectedFiles, this.photoDescription)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (res) => {
          this.photoSuccessMsg = res.message;
          this.loadPhotos(this.order.id!);
          this.selectedFiles = [];
          this.photoDescription = '';
          this.uploading = false;
        },
        error: () => {
          this.photoErrorMsg = this.ts.t('orderDetail.photoUploadError');
          this.uploading = false;
        },
      });
  }

  deletePhoto(id: number) {
    this.photoService
      .deletePhoto(id)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe(() => {
        this.loadPhotos(this.order.id!);
      });
  }

  openLightbox(photo: RepairOrderPhoto) {
    this.lightboxPhoto = photo;
  }

  closeLightbox() {
    this.lightboxPhoto = null;
  }

  /* ── WhatsApp share ── */
  async shareViaWhatsApp(): Promise<void> {
    const phone = this.whatsAppPhone.replace(/[^0-9]/g, '');
    const lines: string[] = [
      `*${this.appSettings.current.appName} — ${this.ts.t('orderDetail.title')} #${this.order.id}*`,
      '',
      `${this.ts.t('orders.vehicle')}: ${this.order.carInfo || 'N/A'}`,
      `${this.ts.t('common.status')}: ${this.getStatusLabel(this.order.status)}`,
      `${this.ts.t('orders.total')}: ${this.currSymbol}${this.order.totalCost?.toFixed(2)}`,
    ];
    if (this.order.notes) {
      lines.push(`${this.ts.t('orders.notes')}: ${this.order.notes}`);
    }
    if (this.orderServices.length > 0) {
      lines.push('', `*${this.ts.t('orderDetail.services')}:*`);
      this.orderServices.forEach((s) =>
        lines.push(
          `  • ${s.serviceName} x${s.quantity} — ${this.currSymbol}${(s.quantity * s.unitPrice).toFixed(2)}`,
        ),
      );
    }
    if (this.orderParts.length > 0) {
      lines.push('', `*${this.ts.t('orderDetail.parts')}:*`);
      this.orderParts.forEach((p) =>
        lines.push(
          `  • ${p.partName} x${p.quantity} — ${this.currSymbol}${(p.quantity * p.unitPrice).toFixed(2)}`,
        ),
      );
    }
    if (this.orderProducts.length > 0) {
      lines.push('', `*${this.ts.t('orderDetail.products')}:*`);
      this.orderProducts.forEach((pr) =>
        lines.push(
          `  • ${pr.productName} x${pr.quantity} — ${this.currSymbol}${(pr.quantity * pr.unitPrice).toFixed(2)}`,
        ),
      );
    }

    const text = lines.join('\n');

    // Try Web Share API with file attachments (works on most mobile browsers
    // and Edge/Chrome desktop with PWA support). Falls back to wa.me URL.
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
      share?: (data: ShareData) => Promise<void>;
    };

    if (this.photos.length > 0 && nav.share && nav.canShare) {
      try {
        const files = await this.fetchPhotosAsFiles();
        const shareData: ShareData = { text, files };
        if (files.length > 0 && nav.canShare(shareData)) {
          await nav.share(shareData);
          return;
        }
      } catch (err) {
        // User cancelled or share failed — fall through to wa.me link.
        console.warn('Web Share with files failed, falling back to wa.me', err);
      }
    }

    // Fallback: include photo URLs as links in the text.
    const fallbackLines = [...lines];
    if (this.photos.length > 0) {
      fallbackLines.push(
        '',
        `📷 ${this.photos.length} ${this.ts.t('orderDetail.photos').toLowerCase()}`,
      );
      this.photos.forEach((ph) => {
        fallbackLines.push(`  ${window.location.origin}${ph.filePath}`);
      });
    }
    const encoded = encodeURIComponent(fallbackLines.join('\n'));
    const url = phone
      ? `https://wa.me/${phone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  }

  /** Downloads each photo and converts it to a File for sharing. */
  private async fetchPhotosAsFiles(): Promise<File[]> {
    const files: File[] = [];
    for (const ph of this.photos) {
      try {
        const resp = await fetch(ph.filePath);
        if (!resp.ok) continue;
        const blob = await resp.blob();
        // Force jpeg MIME because the backend only accepts JPG.
        const file = new File([blob], ph.fileName || `photo-${ph.id}.jpg`, {
          type: blob.type || 'image/jpeg',
        });
        files.push(file);
      } catch {
        // Ignore individual fetch failures; remaining photos still attach.
      }
    }
    return files;
  }

  appendNote(): void {
    const text = this.appendNoteText.trim();
    if (!text) return;
    this.savingAppendNote = true;
    const now = new Date();
    const stamp =
      now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const separator = `\n\n--- [${stamp}] ---\n`;
    const existing = this.order.notes?.trim() || '';
    this.order.notes = existing ? existing + separator + text : text;
    this.repairOrderService
      .updateOrder(this.order)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.appendNoteText = '';
          this.savingAppendNote = false;
          this.toast.success(this.ts.t('orderDetail.noteAdded'));
          this.loadOrder(this.order.id!);
        },
        error: () => {
          this.savingAppendNote = false;
          this.orderErrorMsg = this.ts.t('common.updateError');
        },
      });
  }

  saveOrderHeader(): void {
    this.orderErrorMsg = '';
    this.orderSuccessMsg = '';
    this.repairOrderService
      .updateOrder(this.order)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.orderSuccessMsg = this.ts.t('common.updateSuccess');
          this.loadOrder(this.order.id!);
        },
        error: () => {
          this.orderErrorMsg = this.ts.t('common.updateError');
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
}

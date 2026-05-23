import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-inventory',
  imports: [RouterModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inventory-page">
      <div class="page-header">
        <h1>&#128230; {{ 'inventory.title' | translate }}</h1>
        <p>{{ 'inventory.subtitle' | translate }}</p>
      </div>

      <div class="inventory-tabs">
        <button
          class="tab-btn"
          [class.active]="activeTab === 'parts'"
          (click)="activeTab = 'parts'"
        >
          &#9881; {{ 'inventory.parts' | translate }}
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab === 'products'"
          (click)="activeTab = 'products'"
        >
          &#128230; {{ 'inventory.products' | translate }}
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab === 'services'"
          (click)="activeTab = 'services'"
        >
          &#128736; {{ 'inventory.services' | translate }}
        </button>
      </div>

      <div class="inventory-summary">
        @if (activeTab === 'parts') {
          <div class="summary-card">
            <a
              [routerLink]="'/' + slug + '/inventory/parts'"
              class="btn btn-primary"
              >{{ 'parts.viewAll' | translate }}</a
            >
            <a
              [routerLink]="'/' + slug + '/inventory/parts/add'"
              class="btn btn-secondary"
              >+ {{ 'parts.add' | translate }}</a
            >
          </div>
        }
        @if (activeTab === 'products') {
          <div class="summary-card">
            <a
              [routerLink]="'/' + slug + '/inventory/products'"
              class="btn btn-primary"
              >{{ 'products.viewAll' | translate }}</a
            >
            <a
              [routerLink]="'/' + slug + '/inventory/products/add'"
              class="btn btn-secondary"
              >+ {{ 'products.add' | translate }}</a
            >
          </div>
        }
        @if (activeTab === 'services') {
          <div class="summary-card">
            <a
              [routerLink]="'/' + slug + '/inventory/services'"
              class="btn btn-primary"
              >{{ 'services.viewAll' | translate }}</a
            >
            <a
              [routerLink]="'/' + slug + '/inventory/services/add'"
              class="btn btn-secondary"
              >+ {{ 'services.add' | translate }}</a
            >
          </div>
        }
      </div>
    </div>
  `,
})
export class InventoryComponent {
  private router = inject(Router);
  activeTab: 'parts' | 'products' | 'services' = 'parts';

  get slug(): string {
    return this.router.url.split('/').filter(Boolean)[0] || '';
  }
}

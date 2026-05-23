import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-user-guide',
  imports: [TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="user-guide">
      <h1>{{ 'guide.title' | translate }}</h1>

      <!-- Table of Contents -->
      <nav class="guide-toc">
        <h2>{{ 'guide.toc' | translate }}</h2>
        <ol>
          <li>
            <a href="javascript:void(0)" (click)="scrollTo('introduction')">{{
              'guide.introduction' | translate
            }}</a>
          </li>
          <li>
            <a
              href="javascript:void(0)"
              (click)="scrollTo('getting-started')"
              >{{ 'guide.gettingStarted' | translate }}</a
            >
          </li>
          <li>
            <a href="javascript:void(0)" (click)="scrollTo('dashboard')">{{
              'guide.dashboard' | translate
            }}</a>
          </li>
          <li>
            <a href="javascript:void(0)" (click)="scrollTo('customers')">{{
              'guide.customers' | translate
            }}</a>
          </li>
          <li>
            <a href="javascript:void(0)" (click)="scrollTo('vehicles')">{{
              'guide.vehicles' | translate
            }}</a>
          </li>
          <li>
            <a href="javascript:void(0)" (click)="scrollTo('mechanics')">{{
              'guide.mechanics' | translate
            }}</a>
          </li>
          <li>
            <a href="javascript:void(0)" (click)="scrollTo('inventory')">{{
              'guide.inventory' | translate
            }}</a>
          </li>
          <li>
            <a href="javascript:void(0)" (click)="scrollTo('repair-orders')">{{
              'guide.repairOrders' | translate
            }}</a>
          </li>
          <li>
            <a href="javascript:void(0)" (click)="scrollTo('payments')">{{
              'guide.payments' | translate
            }}</a>
          </li>
          <li>
            <a href="javascript:void(0)" (click)="scrollTo('currencies')">{{
              'guide.currencies' | translate
            }}</a>
          </li>
          <li>
            <a href="javascript:void(0)" (click)="scrollTo('users')">{{
              'guide.users' | translate
            }}</a>
          </li>
          <li>
            <a href="javascript:void(0)" (click)="scrollTo('settings')">{{
              'guide.settings' | translate
            }}</a>
          </li>
          <li>
            <a href="javascript:void(0)" (click)="scrollTo('subscription')">{{
              'guide.subscription' | translate
            }}</a>
          </li>
          <li>
            <a href="javascript:void(0)" (click)="scrollTo('roles')">{{
              'guide.roles' | translate
            }}</a>
          </li>
        </ol>
      </nav>

      <!-- Introduction -->
      <section id="introduction" class="guide-section">
        <h2>1. {{ 'guide.introduction' | translate }}</h2>
        <p>{{ 'guide.intro.desc' | translate }}</p>
        <h3>{{ 'guide.intro.keyFeatures' | translate }}</h3>
        <ul>
          <li>{{ 'guide.intro.feature1' | translate }}</li>
          <li>{{ 'guide.intro.feature2' | translate }}</li>
          <li>{{ 'guide.intro.feature3' | translate }}</li>
          <li>{{ 'guide.intro.feature4' | translate }}</li>
          <li>{{ 'guide.intro.feature5' | translate }}</li>
          <li>{{ 'guide.intro.feature6' | translate }}</li>
          <li>{{ 'guide.intro.feature7' | translate }}</li>
          <li>{{ 'guide.intro.feature8' | translate }}</li>
        </ul>
      </section>

      <!-- Getting Started -->
      <section id="getting-started" class="guide-section">
        <h2>2. {{ 'guide.gettingStarted' | translate }}</h2>
        <h3>{{ 'guide.start.login' | translate }}</h3>
        <ol>
          <li>{{ 'guide.start.step1' | translate }}</li>
          <li>{{ 'guide.start.step2' | translate }}</li>
          <li>{{ 'guide.start.step3' | translate }}</li>
        </ol>
        <h3>{{ 'guide.start.navigation' | translate }}</h3>
        <p>{{ 'guide.start.navDesc' | translate }}</p>
        <h3>{{ 'guide.start.language' | translate }}</h3>
        <p>{{ 'guide.start.langDesc' | translate }}</p>
      </section>

      <!-- Dashboard -->
      <section id="dashboard" class="guide-section">
        <h2>
          3. {{ 'guide.dashboard' | translate }}
          <a
            routerLink="../dashboard"
            class="module-link"
            title="Go to Dashboard"
            >↗</a
          >
        </h2>
        <p>{{ 'guide.dash.desc' | translate }}</p>
        <h3>{{ 'guide.dash.metrics' | translate }}</h3>
        <ul>
          <li>
            <strong>{{ 'guide.dash.totalCustomers' | translate }}:</strong>
            {{ 'guide.dash.totalCustomersDesc' | translate }}
          </li>
          <li>
            <strong>{{ 'guide.dash.totalVehicles' | translate }}:</strong>
            {{ 'guide.dash.totalVehiclesDesc' | translate }}
          </li>
          <li>
            <strong>{{ 'guide.dash.totalOrders' | translate }}:</strong>
            {{ 'guide.dash.totalOrdersDesc' | translate }}
          </li>
          <li>
            <strong>{{ 'guide.dash.totalRevenue' | translate }}:</strong>
            {{ 'guide.dash.totalRevenueDesc' | translate }}
          </li>
          <li>
            <strong>{{ 'guide.dash.totalPaid' | translate }}:</strong>
            {{ 'guide.dash.totalPaidDesc' | translate }}
          </li>
        </ul>
        <p class="guide-note">{{ 'guide.dash.mechanicNote' | translate }}</p>
      </section>

      <!-- Customers -->
      <section id="customers" class="guide-section">
        <h2>
          4. {{ 'guide.customers' | translate }}
          <a
            routerLink="../customers"
            class="module-link"
            title="Go to Customers"
            >↗</a
          >
        </h2>
        <h3>{{ 'guide.cust.add' | translate }}</h3>
        <p>{{ 'guide.cust.addDesc' | translate }}</p>
        <ul>
          <li>{{ 'guide.cust.field1' | translate }}</li>
          <li>{{ 'guide.cust.field2' | translate }}</li>
          <li>{{ 'guide.cust.field3' | translate }}</li>
          <li>{{ 'guide.cust.field4' | translate }}</li>
          <li>{{ 'guide.cust.field5' | translate }}</li>
        </ul>
        <h3>{{ 'guide.cust.detail' | translate }}</h3>
        <p>{{ 'guide.cust.detailDesc' | translate }}</p>
      </section>

      <!-- Vehicles -->
      <section id="vehicles" class="guide-section">
        <h2>
          5. {{ 'guide.vehicles' | translate }}
          <a routerLink="../cars" class="module-link" title="Go to Vehicles"
            >↗</a
          >
        </h2>
        <p>{{ 'guide.veh.desc' | translate }}</p>
        <h3>{{ 'guide.veh.brands' | translate }}</h3>
        <p>{{ 'guide.veh.brandsDesc' | translate }}</p>
        <h3>{{ 'guide.veh.models' | translate }}</h3>
        <p>{{ 'guide.veh.modelsDesc' | translate }}</p>
        <h3>{{ 'guide.veh.addVehicle' | translate }}</h3>
        <ul>
          <li>{{ 'guide.veh.field1' | translate }}</li>
          <li>{{ 'guide.veh.field2' | translate }}</li>
          <li>{{ 'guide.veh.field3' | translate }}</li>
          <li>{{ 'guide.veh.field4' | translate }}</li>
          <li>{{ 'guide.veh.field5' | translate }}</li>
          <li>{{ 'guide.veh.field6' | translate }}</li>
          <li>{{ 'guide.veh.field7' | translate }}</li>
          <li>{{ 'guide.veh.field8' | translate }}</li>
        </ul>
      </section>

      <!-- Mechanics -->
      <section id="mechanics" class="guide-section">
        <h2>
          6. {{ 'guide.mechanics' | translate }}
          <a
            routerLink="../mechanics"
            class="module-link"
            title="Go to Mechanics"
            >↗</a
          >
        </h2>
        <h3>{{ 'guide.mech.add' | translate }}</h3>
        <ul>
          <li>{{ 'guide.mech.field1' | translate }}</li>
          <li>{{ 'guide.mech.field2' | translate }}</li>
          <li>{{ 'guide.mech.field3' | translate }}</li>
          <li>{{ 'guide.mech.field4' | translate }}</li>
        </ul>
        <h3>{{ 'guide.mech.linking' | translate }}</h3>
        <p>{{ 'guide.mech.linkingDesc' | translate }}</p>
      </section>

      <!-- Inventory -->
      <section id="inventory" class="guide-section">
        <h2>
          7. {{ 'guide.inventory' | translate }}
          <a
            routerLink="../inventory"
            class="module-link"
            title="Go to Inventory"
            >↗</a
          >
        </h2>
        <p>{{ 'guide.inv.desc' | translate }}</p>
        <h3>{{ 'guide.inv.parts' | translate }}</h3>
        <p>{{ 'guide.inv.partsDesc' | translate }}</p>
        <h3>{{ 'guide.inv.products' | translate }}</h3>
        <p>{{ 'guide.inv.productsDesc' | translate }}</p>
        <h3>{{ 'guide.inv.services' | translate }}</h3>
        <p>{{ 'guide.inv.servicesDesc' | translate }}</p>
        <p class="guide-note">{{ 'guide.inv.stockNote' | translate }}</p>
      </section>

      <!-- Repair Orders -->
      <section id="repair-orders" class="guide-section">
        <h2>
          8. {{ 'guide.repairOrders' | translate }}
          <a
            routerLink="../repair-orders"
            class="module-link"
            title="Go to Repair Orders"
            >↗</a
          >
        </h2>
        <p>{{ 'guide.ro.desc' | translate }}</p>
        <h3>{{ 'guide.ro.lifecycle' | translate }}</h3>
        <div class="lifecycle-flow">
          <span class="status-badge pending">{{
            'guide.ro.pending' | translate
          }}</span>
          <span class="flow-arrow">→</span>
          <span class="status-badge progress">{{
            'guide.ro.inProgress' | translate
          }}</span>
          <span class="flow-arrow">→</span>
          <span class="status-badge completed">{{
            'guide.ro.completed' | translate
          }}</span>
        </div>
        <h3>{{ 'guide.ro.create' | translate }}</h3>
        <p>{{ 'guide.ro.createDesc' | translate }}</p>
        <h3>{{ 'guide.ro.addItems' | translate }}</h3>
        <ul>
          <li>{{ 'guide.ro.addServices' | translate }}</li>
          <li>{{ 'guide.ro.addParts' | translate }}</li>
          <li>{{ 'guide.ro.addProducts' | translate }}</li>
          <li>{{ 'guide.ro.addPhotos' | translate }}</li>
        </ul>
        <p class="guide-note">{{ 'guide.ro.stockNote' | translate }}</p>
        <h3>{{ 'guide.ro.invoice' | translate }}</h3>
        <p>{{ 'guide.ro.invoiceDesc' | translate }}</p>
      </section>

      <!-- Payments -->
      <section id="payments" class="guide-section">
        <h2>
          9. {{ 'guide.payments' | translate }}
          <a routerLink="../payments" class="module-link" title="Go to Payments"
            >↗</a
          >
        </h2>
        <h3>{{ 'guide.pay.record' | translate }}</h3>
        <p>{{ 'guide.pay.recordDesc' | translate }}</p>
        <ul>
          <li>{{ 'guide.pay.field1' | translate }}</li>
          <li>{{ 'guide.pay.field2' | translate }}</li>
          <li>{{ 'guide.pay.field3' | translate }}</li>
          <li>{{ 'guide.pay.field4' | translate }}</li>
          <li>{{ 'guide.pay.field5' | translate }}</li>
        </ul>
        <h3>{{ 'guide.pay.multiCurrency' | translate }}</h3>
        <p>{{ 'guide.pay.multiCurrencyDesc' | translate }}</p>
        <h3>{{ 'guide.pay.multiOrder' | translate }}</h3>
        <p>{{ 'guide.pay.multiOrderDesc' | translate }}</p>
      </section>

      <!-- Currencies -->
      <section id="currencies" class="guide-section">
        <h2>
          10. {{ 'guide.currencies' | translate }}
          <a
            routerLink="../currencies"
            class="module-link"
            title="Go to Currencies"
            >↗</a
          >
        </h2>
        <p>{{ 'guide.curr.desc' | translate }}</p>
        <h3>{{ 'guide.curr.default' | translate }}</h3>
        <p>{{ 'guide.curr.defaultDesc' | translate }}</p>
        <h3>{{ 'guide.curr.rates' | translate }}</h3>
        <p>{{ 'guide.curr.ratesDesc' | translate }}</p>
      </section>

      <!-- Users -->
      <section id="users" class="guide-section">
        <h2>
          11. {{ 'guide.users' | translate }}
          <a routerLink="../users" class="module-link" title="Go to Users">↗</a>
        </h2>
        <p>{{ 'guide.usr.desc' | translate }}</p>
        <h3>{{ 'guide.usr.create' | translate }}</h3>
        <ul>
          <li>{{ 'guide.usr.field1' | translate }}</li>
          <li>{{ 'guide.usr.field2' | translate }}</li>
          <li>{{ 'guide.usr.field3' | translate }}</li>
          <li>{{ 'guide.usr.field4' | translate }}</li>
          <li>{{ 'guide.usr.field5' | translate }}</li>
        </ul>
      </section>

      <!-- Settings -->
      <section id="settings" class="guide-section">
        <h2>
          12. {{ 'guide.settings' | translate }}
          <a routerLink="../settings" class="module-link" title="Go to Settings"
            >↗</a
          >
        </h2>
        <p>{{ 'guide.set.desc' | translate }}</p>
        <ul>
          <li>{{ 'guide.set.field1' | translate }}</li>
          <li>{{ 'guide.set.field2' | translate }}</li>
          <li>{{ 'guide.set.field3' | translate }}</li>
          <li>{{ 'guide.set.field4' | translate }}</li>
          <li>{{ 'guide.set.field5' | translate }}</li>
          <li>{{ 'guide.set.field6' | translate }}</li>
        </ul>
      </section>

      <!-- Subscription -->
      <section id="subscription" class="guide-section">
        <h2>
          13. {{ 'guide.subscription' | translate }}
          <a
            routerLink="../subscription-manage"
            class="module-link"
            title="Go to Subscription"
            >↗</a
          >
        </h2>
        <p>{{ 'guide.sub.desc' | translate }}</p>
        <h3>{{ 'guide.sub.statuses' | translate }}</h3>
        <ul>
          <li>
            <strong>{{ 'guide.sub.active' | translate }}:</strong>
            {{ 'guide.sub.activeDesc' | translate }}
          </li>
          <li>
            <strong>{{ 'guide.sub.inactive' | translate }}:</strong>
            {{ 'guide.sub.inactiveDesc' | translate }}
          </li>
          <li>
            <strong>{{ 'guide.sub.cancelled' | translate }}:</strong>
            {{ 'guide.sub.cancelledDesc' | translate }}
          </li>
          <li>
            <strong>{{ 'guide.sub.expired' | translate }}:</strong>
            {{ 'guide.sub.expiredDesc' | translate }}
          </li>
        </ul>
      </section>

      <!-- Roles -->
      <section id="roles" class="guide-section">
        <h2>14. {{ 'guide.roles' | translate }}</h2>
        <div class="roles-table-wrapper">
          <table class="roles-table">
            <thead>
              <tr>
                <th>{{ 'guide.roles.feature' | translate }}</th>
                <th>Admin</th>
                <th>{{ 'guide.roles.supervisor' | translate }}</th>
                <th>{{ 'guide.roles.mechanic' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dashboard</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅*</td>
              </tr>
              <tr>
                <td>{{ 'guide.customers' | translate }}</td>
                <td>✅</td>
                <td>✅</td>
                <td>❌</td>
              </tr>
              <tr>
                <td>{{ 'guide.vehicles' | translate }}</td>
                <td>✅</td>
                <td>✅</td>
                <td>❌</td>
              </tr>
              <tr>
                <td>{{ 'guide.inventory' | translate }}</td>
                <td>✅</td>
                <td>✅</td>
                <td>❌</td>
              </tr>
              <tr>
                <td>{{ 'guide.repairOrders' | translate }}</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅*</td>
              </tr>
              <tr>
                <td>{{ 'guide.payments' | translate }}</td>
                <td>✅</td>
                <td>✅</td>
                <td>❌</td>
              </tr>
              <tr>
                <td>{{ 'guide.currencies' | translate }}</td>
                <td>✅</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr>
                <td>{{ 'guide.users' | translate }}</td>
                <td>✅</td>
                <td>✅</td>
                <td>❌</td>
              </tr>
              <tr>
                <td>{{ 'guide.settings' | translate }}</td>
                <td>✅</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr>
                <td>{{ 'guide.subscription' | translate }}</td>
                <td>✅</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="guide-note">{{ 'guide.roles.mechanicNote' | translate }}</p>
      </section>

      <!-- Tips -->
      <section class="guide-section">
        <h2>{{ 'guide.tips.title' | translate }}</h2>
        <ul>
          <li>{{ 'guide.tips.tip1' | translate }}</li>
          <li>{{ 'guide.tips.tip2' | translate }}</li>
          <li>{{ 'guide.tips.tip3' | translate }}</li>
          <li>{{ 'guide.tips.tip4' | translate }}</li>
          <li>{{ 'guide.tips.tip5' | translate }}</li>
        </ul>
      </section>
    </div>
  `,
  styles: `
    .user-guide {
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem;
    }
    .user-guide h1 {
      font-size: 1.75rem;
      margin-bottom: 1.5rem;
      color: #1a1a2e;
    }
    .user-guide h2 {
      font-size: 1.35rem;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
      color: #16213e;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 0.4rem;
    }
    .user-guide h3 {
      font-size: 1.1rem;
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
      color: #0f3460;
    }
    .user-guide p {
      line-height: 1.7;
      color: #333;
      margin-bottom: 0.75rem;
    }
    .user-guide ul,
    .user-guide ol {
      padding-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .user-guide li {
      line-height: 1.8;
      color: #444;
    }
    .guide-toc {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 2rem;
    }
    .guide-toc h2 {
      font-size: 1.1rem;
      margin-top: 0;
      border: none;
      padding: 0;
    }
    .guide-toc ol {
      columns: 2;
      column-gap: 2rem;
    }
    .guide-toc a {
      color: #0f3460;
      text-decoration: none;
    }
    .guide-toc a:hover {
      text-decoration: underline;
    }
    .guide-section {
      margin-bottom: 2rem;
    }
    .guide-note {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    .lifecycle-flow {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1rem 0;
      flex-wrap: wrap;
    }
    .status-badge {
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-weight: 500;
      font-size: 0.9rem;
    }
    .status-badge.pending {
      background: #fff3cd;
      color: #856404;
    }
    .status-badge.progress {
      background: #cce5ff;
      color: #004085;
    }
    .status-badge.completed {
      background: #d4edda;
      color: #155724;
    }
    .flow-arrow {
      font-size: 1.25rem;
      color: #666;
    }
    .roles-table-wrapper {
      overflow-x: auto;
    }
    .roles-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.9rem;
    }
    .roles-table th,
    .roles-table td {
      border: 1px solid #dee2e6;
      padding: 0.5rem 0.75rem;
      text-align: center;
    }
    .roles-table th {
      background: #f1f3f5;
      font-weight: 600;
    }
    .roles-table td:first-child {
      text-align: left;
      font-weight: 500;
    }
    @media (max-width: 600px) {
      .guide-toc ol {
        columns: 1;
      }
      .user-guide {
        padding: 1rem;
      }
    }
    .module-link {
      font-size: 0.85rem;
      color: #0f3460;
      text-decoration: none;
      margin-left: 0.5rem;
      opacity: 0.6;
      transition: opacity 0.2s;
    }
    .module-link:hover {
      opacity: 1;
      text-decoration: none;
    }
  `,
})
export class UserGuideComponent {
  private ts = inject(TranslationService);

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}

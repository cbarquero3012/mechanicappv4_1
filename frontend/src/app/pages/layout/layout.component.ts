import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  DestroyRef,
  inject,
  computed,
  effect,
  ChangeDetectorRef,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { AppSettingsService } from '../../services/app-settings.service';
import { SubscriptionService } from '../../services/subscription.service';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ToastComponent } from '../../components/toast/toast.component';
import { DemoBannerComponent } from '../../components/demo-banner/demo-banner.component';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-layout',
  imports: [
    RouterModule,
    TranslatePipe,
    ToastComponent,
    DemoBannerComponent,
    LocalDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="layout"
      [class.sidebar-open]="sidebarOpen"
      [class.sidebar-collapsed]="sidebarCollapsed"
    >
      <app-toast></app-toast>
      <div class="sidebar-overlay" (click)="sidebarOpen = false"></div>

      <!-- ─── SIDEBAR ─── -->
      <nav class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <img [src]="logo()" [attr.alt]="appName()" class="sidebar-logo" />
            <span class="brand-text">{{ appName() }}</span>
          </div>
          <button class="sidebar-close" (click)="sidebarOpen = false">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <!-- Collapse toggle -->
        <button
          class="sidebar-collapse-btn"
          (click)="sidebarCollapsed = !sidebarCollapsed"
        >
          <span class="material-icons-outlined">
            {{ sidebarCollapsed ? 'chevron_right' : 'chevron_left' }}
          </span>
        </button>

        <ul class="nav-menu">
          <!-- Dashboard -->
          <li class="nav-item">
            <a
              [routerLink]="'/' + slug + '/dashboard'"
              routerLinkActive="active"
              (click)="closeSidebarOnMobile()"
              class="nav-link"
            >
              <span class="material-icons-outlined nav-icon">dashboard</span>
              <span class="nav-label">{{ 'nav.dashboard' | translate }}</span>
            </a>
          </li>

          <li class="nav-divider"></li>

          <!-- Vehicle Catalog -->
          @if (authService.hasAccess('car-catalog')) {
            <li class="nav-item nav-group">
              <div class="nav-group-header" (click)="toggle('vehicleCatalog')">
                <span class="material-icons-outlined nav-icon"
                  >directions_car</span
                >
                <span class="nav-label">{{
                  'nav.vehicleCatalog' | translate
                }}</span>
                <span
                  class="material-icons-outlined nav-chevron"
                  [class.open]="open['vehicleCatalog']"
                  >expand_more</span
                >
              </div>
              @if (open['vehicleCatalog']) {
                <ul class="nav-submenu">
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/cars'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >garage</span
                      >
                      <span class="nav-label">{{
                        'nav.viewCars' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/cars/add'"
                      routerLinkActive="active"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >add_circle_outline</span
                      >
                      <span class="nav-label">{{
                        'nav.addCar' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/car-brands'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >branding_watermark</span
                      >
                      <span class="nav-label">{{
                        'nav.viewBrands' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/car-brands/add'"
                      routerLinkActive="active"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >add_circle_outline</span
                      >
                      <span class="nav-label">{{
                        'nav.addBrand' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/car-models'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >format_list_bulleted</span
                      >
                      <span class="nav-label">{{
                        'nav.viewModels' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/car-models/add'"
                      routerLinkActive="active"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >add_circle_outline</span
                      >
                      <span class="nav-label">{{
                        'nav.addModel' | translate
                      }}</span>
                    </a>
                  </li>
                </ul>
              }
            </li>
          }

          <!-- Inventory -->
          @if (authService.hasAccess('inventory')) {
            <li class="nav-item nav-group">
              <div class="nav-group-header" (click)="toggle('inventory')">
                <span class="material-icons-outlined nav-icon"
                  >inventory_2</span
                >
                <span class="nav-label">{{
                  'nav.inventorySection' | translate
                }}</span>
                <span
                  class="material-icons-outlined nav-chevron"
                  [class.open]="open['inventory']"
                  >expand_more</span
                >
              </div>
              @if (open['inventory']) {
                <ul class="nav-submenu">
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/inventory'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >assessment</span
                      >
                      <span class="nav-label">{{
                        'nav.overview' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/inventory/parts'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >settings</span
                      >
                      <span class="nav-label">{{
                        'nav.parts' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/inventory/products'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >shopping_bag</span
                      >
                      <span class="nav-label">{{
                        'nav.products' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/inventory/services'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >build</span
                      >
                      <span class="nav-label">{{
                        'nav.services' | translate
                      }}</span>
                    </a>
                  </li>
                </ul>
              }
            </li>
          }

          <!-- Customers -->
          @if (authService.hasAccess('customers')) {
            <li class="nav-item nav-group">
              <div class="nav-group-header" (click)="toggle('customers')">
                <span class="material-icons-outlined nav-icon">people</span>
                <span class="nav-label">{{
                  'nav.customersSection' | translate
                }}</span>
                <span
                  class="material-icons-outlined nav-chevron"
                  [class.open]="open['customers']"
                  >expand_more</span
                >
              </div>
              @if (open['customers']) {
                <ul class="nav-submenu">
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/customers'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >person</span
                      >
                      <span class="nav-label">{{
                        'nav.viewCustomers' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/customers/add'"
                      routerLinkActive="active"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >person_add</span
                      >
                      <span class="nav-label">{{
                        'nav.addCustomer' | translate
                      }}</span>
                    </a>
                  </li>
                </ul>
              }
            </li>
          }

          <!-- Mechanics -->
          @if (authService.hasAccess('mechanics')) {
            <li class="nav-item nav-group">
              <div class="nav-group-header" (click)="toggle('mechanics')">
                <span class="material-icons-outlined nav-icon"
                  >engineering</span
                >
                <span class="nav-label">{{
                  'nav.mechanicsSection' | translate
                }}</span>
                <span
                  class="material-icons-outlined nav-chevron"
                  [class.open]="open['mechanics']"
                  >expand_more</span
                >
              </div>
              @if (open['mechanics']) {
                <ul class="nav-submenu">
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/mechanics'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >handyman</span
                      >
                      <span class="nav-label">{{
                        'nav.viewMechanics' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/mechanics/add'"
                      routerLinkActive="active"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >person_add</span
                      >
                      <span class="nav-label">{{
                        'nav.addMechanic' | translate
                      }}</span>
                    </a>
                  </li>
                </ul>
              }
            </li>
          }

          <!-- Repair Orders -->
          @if (authService.hasAccess('repair-orders')) {
            <li class="nav-item nav-group">
              <div class="nav-group-header" (click)="toggle('repairOrders')">
                <span class="material-icons-outlined nav-icon"
                  >construction</span
                >
                <span class="nav-label">{{
                  'nav.repairOrdersSection' | translate
                }}</span>
                <span
                  class="material-icons-outlined nav-chevron"
                  [class.open]="open['repairOrders']"
                  >expand_more</span
                >
              </div>
              @if (open['repairOrders']) {
                <ul class="nav-submenu">
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/repair-orders'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >receipt_long</span
                      >
                      <span class="nav-label">{{
                        'nav.viewOrders' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/repair-orders/add'"
                      routerLinkActive="active"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >note_add</span
                      >
                      <span class="nav-label">{{
                        'nav.newOrder' | translate
                      }}</span>
                    </a>
                  </li>
                </ul>
              }
            </li>
          }

          <!-- Payments -->
          @if (authService.hasAccess('payments')) {
            <li class="nav-item nav-group">
              <div class="nav-group-header" (click)="toggle('payments')">
                <span class="material-icons-outlined nav-icon">payments</span>
                <span class="nav-label">{{
                  'nav.paymentsSection' | translate
                }}</span>
                <span
                  class="material-icons-outlined nav-chevron"
                  [class.open]="open['payments']"
                  >expand_more</span
                >
              </div>
              @if (open['payments']) {
                <ul class="nav-submenu">
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/payments'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >account_balance_wallet</span
                      >
                      <span class="nav-label">{{
                        'nav.viewPayments' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/payments/add'"
                      routerLinkActive="active"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >add_card</span
                      >
                      <span class="nav-label">{{
                        'nav.newPayment' | translate
                      }}</span>
                    </a>
                  </li>
                </ul>
              }
            </li>
          }

          <!-- Add User (supervisor only, admins see it in Administration) -->
          @if (
            authService.hasAccess('users') && !authService.hasAccess('admin')
          ) {
            <li class="nav-divider"></li>
            <li class="nav-item">
              <a
                routerLinkActive="active"
                [routerLink]="'/' + slug + '/users/add'"
                (click)="closeSidebarOnMobile()"
                class="nav-link"
              >
                <span class="material-icons-outlined nav-icon">person_add</span>
                <span class="nav-label">{{ 'nav.addUser' | translate }}</span>
              </a>
            </li>
          }

          <li class="nav-divider"></li>

          <!-- Administration (admin only) -->
          @if (authService.hasAccess('admin')) {
            <li class="nav-item nav-group">
              <div class="nav-group-header" (click)="toggle('admin')">
                <span class="material-icons-outlined nav-icon"
                  >admin_panel_settings</span
                >
                <span class="nav-label">{{
                  'nav.administration' | translate
                }}</span>
                <span
                  class="material-icons-outlined nav-chevron"
                  [class.open]="open['admin']"
                  >expand_more</span
                >
              </div>
              @if (open['admin']) {
                <ul class="nav-submenu">
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/users'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >group</span
                      >
                      <span class="nav-label">{{
                        'nav.viewUsers' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/users/add'"
                      routerLinkActive="active"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >person_add</span
                      >
                      <span class="nav-label">{{
                        'nav.addUser' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/currencies'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >currency_exchange</span
                      >
                      <span class="nav-label">{{
                        'nav.viewCurrencies' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/currencies/add'"
                      routerLinkActive="active"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >add_circle_outline</span
                      >
                      <span class="nav-label">{{
                        'nav.addCurrency' | translate
                      }}</span>
                    </a>
                  </li>
                </ul>
              }
            </li>
          }

          <!-- Configuration (admin and super-admin) -->
          @if (authService.hasAccess('admin')) {
            <li class="nav-item nav-group">
              <div class="nav-group-header" (click)="toggle('superAdmin')">
                <span class="material-icons-outlined nav-icon">security</span>
                <span class="nav-label">{{
                  'nav.settingsSection' | translate
                }}</span>
                <span
                  class="material-icons-outlined nav-chevron"
                  [class.open]="open['superAdmin']"
                  >expand_more</span
                >
              </div>
              @if (open['superAdmin']) {
                <ul class="nav-submenu">
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/settings'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon">tune</span>
                      <span class="nav-label">{{
                        'nav.settings' | translate
                      }}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      [routerLink]="'/' + slug + '/subscription-manage'"
                      routerLinkActive="active"
                      [routerLinkActiveOptions]="{ exact: true }"
                      (click)="closeSidebarOnMobile()"
                      class="nav-link sub-link"
                    >
                      <span class="material-icons-outlined nav-icon"
                        >card_membership</span
                      >
                      <span class="nav-label">{{
                        'nav.subscription' | translate
                      }}</span>
                    </a>
                  </li>
                  @if (authService.hasAccess('superAdmin')) {
                    <li>
                      <a
                        [routerLink]="'/' + slug + '/tenants'"
                        routerLinkActive="active"
                        [routerLinkActiveOptions]="{ exact: true }"
                        (click)="closeSidebarOnMobile()"
                        class="nav-link sub-link"
                      >
                        <span class="material-icons-outlined nav-icon"
                          >domain</span
                        >
                        <span class="nav-label">{{
                          'nav.tenants' | translate
                        }}</span>
                      </a>
                    </li>
                  }
                </ul>
              }
            </li>
          }

          <!-- User Guide -->
          <li class="nav-item">
            <a
              [routerLink]="'/' + slug + '/user-guide'"
              routerLinkActive="active"
              (click)="closeSidebarOnMobile()"
              class="nav-link"
            >
              <span class="material-icons-outlined nav-icon">menu_book</span>
              <span class="nav-label">{{ 'nav.userGuide' | translate }}</span>
            </a>
          </li>
        </ul>

        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          <div class="lang-toggle">
            <button
              [class.active]="ts.lang === 'en'"
              (click)="ts.setLang('en')"
            >
              EN
            </button>
            <button
              [class.active]="ts.lang === 'es'"
              (click)="ts.setLang('es')"
            >
              ES
            </button>
          </div>
          <div class="sidebar-user">
            <span class="material-icons-outlined user-avatar"
              >account_circle</span
            >
            <div class="user-details">
              <span class="user-info">{{ currentUser }}</span>
              <button class="logout-btn" (click)="onLogout()">
                <span class="material-icons-outlined">logout</span>
                <span class="nav-label">{{ 'nav.logout' | translate }}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- ─── MAIN CONTENT ─── -->
      <main class="main-content">
        <div class="topbar">
          <button class="hamburger" (click)="sidebarOpen = true">
            <span class="material-icons-outlined">menu</span>
          </button>
          <span class="topbar-title">{{ appName() }}</span>
          <div class="topbar-lang-toggle">
            <button
              [class.active]="ts.lang === 'en'"
              (click)="ts.setLang('en')"
            >
              EN
            </button>
            <button
              [class.active]="ts.lang === 'es'"
              (click)="ts.setLang('es')"
            >
              ES
            </button>
          </div>
        </div>
        <app-demo-banner></app-demo-banner>
        <router-outlet></router-outlet>
        @if (subWarning) {
          <div class="sub-warning-banner">
            <span class="material-icons-outlined">warning</span>
            {{ 'subscription.expiringWarning' | translate }}
            {{ subExpiresAt | localDate: 'mediumDate' }}
          </div>
        }
      </main>
    </div>
  `,
})
export class LayoutComponent implements OnInit {
  sidebarOpen = false;
  sidebarCollapsed = false;
  subWarning = false;
  subExpiresAt: string | null = null;
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  /** Read branding from signals */
  readonly appName = computed(() => this.appSettings.settings().appName);
  readonly logo = computed(
    () => this.appSettings.settings().logoUrl || '/assets/logo.svg',
  );

  /** Tracks which sidebar sections are open */
  open: Record<string, boolean> = {
    vehicleCatalog: false,
    inventory: false,
    customers: false,
    mechanics: false,
    repairOrders: false,
    payments: false,
    admin: false,
    superAdmin: false,
  };

  get currentUser(): string {
    return this.authService.currentUser || 'User';
  }

  /** Active tenant slug — always derived from the current URL (first path segment) */
  get slug(): string {
    return (
      this.router.url.split('/').filter(Boolean)[0] ||
      localStorage.getItem('tenant_slug') ||
      ''
    );
  }

  constructor(
    public authService: AuthService,
    private router: Router,
    public ts: TranslationService,
    private appSettings: AppSettingsService,
    private subService: SubscriptionService,
  ) {
    // React to subscription status signal changes
    effect(() => {
      const s = this.subService.status();
      if (s.active && s.expiresAt) {
        const diff = new Date(s.expiresAt).getTime() - Date.now();
        const daysLeft = diff / (1000 * 60 * 60 * 24);
        this.subWarning = daysLeft > 0 && daysLeft <= 7;
        this.subExpiresAt = s.expiresAt;
      } else {
        this.subWarning = false;
      }
    });
  }

  ngOnInit(): void {
    this.subService
      .checkStatus()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe();

    // Auto-expand the section that matches the current URL
    this.expandSectionForUrl(this.router.url);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
        markDirty(this.cdr),
      )
      .subscribe((e) => this.expandSectionForUrl(e.urlAfterRedirects));
  }

  toggle(section: string): void {
    this.open[section] = !this.open[section];
  }

  /** Auto-expand the section matching the active route */
  private expandSectionForUrl(url: string): void {
    // Strip query/hash then remove the tenant slug prefix so prefix matching works
    const clean = url.split('?')[0].split('#')[0];
    const path = '/' + clean.split('/').filter(Boolean).slice(1).join('/');

    const map: Record<string, string[]> = {
      vehicleCatalog: ['/cars', '/car-brands', '/car-models'],
      inventory: ['/inventory'],
      customers: ['/customers'],
      mechanics: ['/mechanics'],
      repairOrders: ['/repair-orders'],
      payments: ['/payments'],
      admin: ['/users', '/currencies'],
      superAdmin: ['/settings', '/subscription-manage', '/tenants'],
    };
    for (const [section, prefixes] of Object.entries(map)) {
      if (prefixes.some((p) => path.startsWith(p))) {
        this.open[section] = true;
      }
    }
  }

  onLogout(): void {
    const slug = this.slug;
    this.authService.logout();
    this.router.navigate([slug ? `/${slug}/login` : '/landing']);
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth <= 768) {
      this.sidebarOpen = false;
    }
  }
}

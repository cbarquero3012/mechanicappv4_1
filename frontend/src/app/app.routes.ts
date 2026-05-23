import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { subscriptionGuard } from './guards/subscription.guard';

export const routes: Routes = [
  {
    path: 'landing',
    loadComponent: () =>
      import('./pages/landing/landing.component').then(
        (m) => m.LandingComponent,
      ),
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./pages/onboarding/onboarding.component').then(
        (m) => m.OnboardingComponent,
      ),
  },
  // Bare /login for users who already have tenant_slug in localStorage
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  { path: 'subscription', redirectTo: 'landing', pathMatch: 'full' },
  {
    path: ':slug',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'subscription',
        loadComponent: () =>
          import('./pages/subscription/subscription.component').then(
            (m) => m.SubscriptionComponent,
          ),
      },
      {
        path: '',
        loadComponent: () =>
          import('./pages/layout/layout.component').then(
            (m) => m.LayoutComponent,
          ),
        canActivate: [authGuard, subscriptionGuard],
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./pages/dashboard/dashboard.component').then(
                (m) => m.DashboardComponent,
              ),
          },
          {
            path: 'cars',
            loadComponent: () =>
              import('./pages/cars/view-cars.component').then(
                (m) => m.ViewCarsComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'car-catalog' },
          },
          {
            path: 'cars/add',
            loadComponent: () =>
              import('./pages/cars/add-car.component').then(
                (m) => m.AddCarComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'car-catalog' },
          },
          {
            path: 'car-brands',
            loadComponent: () =>
              import('./pages/car-brands/view-car-brands.component').then(
                (m) => m.ViewCarBrandsComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'car-catalog' },
          },
          {
            path: 'car-brands/add',
            loadComponent: () =>
              import('./pages/car-brands/add-car-brand.component').then(
                (m) => m.AddCarBrandComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'car-catalog' },
          },
          {
            path: 'car-models',
            loadComponent: () =>
              import('./pages/car-models/view-car-models.component').then(
                (m) => m.ViewCarModelsComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'car-catalog' },
          },
          {
            path: 'car-models/add',
            loadComponent: () =>
              import('./pages/car-models/add-car-model.component').then(
                (m) => m.AddCarModelComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'car-catalog' },
          },
          {
            path: 'inventory',
            loadComponent: () =>
              import('./pages/inventory/inventory.component').then(
                (m) => m.InventoryComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'inventory' },
          },
          {
            path: 'inventory/parts',
            loadComponent: () =>
              import('./pages/inventory/parts/view-parts.component').then(
                (m) => m.ViewPartsComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'inventory' },
          },
          {
            path: 'inventory/parts/add',
            loadComponent: () =>
              import('./pages/inventory/parts/add-part.component').then(
                (m) => m.AddPartComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'inventory' },
          },
          {
            path: 'inventory/products',
            loadComponent: () =>
              import('./pages/inventory/products/view-products.component').then(
                (m) => m.ViewProductsComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'inventory' },
          },
          {
            path: 'inventory/products/add',
            loadComponent: () =>
              import('./pages/inventory/products/add-product.component').then(
                (m) => m.AddProductComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'inventory' },
          },
          {
            path: 'inventory/services',
            loadComponent: () =>
              import('./pages/inventory/services/view-services.component').then(
                (m) => m.ViewServicesComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'inventory' },
          },
          {
            path: 'inventory/services/add',
            loadComponent: () =>
              import('./pages/inventory/services/add-service.component').then(
                (m) => m.AddServiceComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'inventory' },
          },
          {
            path: 'customers',
            loadComponent: () =>
              import('./pages/customers/view-customers.component').then(
                (m) => m.ViewCustomersComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'customers' },
          },
          {
            path: 'customers/add',
            loadComponent: () =>
              import('./pages/customers/add-customer.component').then(
                (m) => m.AddCustomerComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'customers' },
          },
          {
            path: 'customers/:id',
            loadComponent: () =>
              import('./pages/customers/customer-detail.component').then(
                (m) => m.CustomerDetailComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'customers' },
          },
          {
            path: 'mechanics',
            loadComponent: () =>
              import('./pages/mechanics/view-mechanics.component').then(
                (m) => m.ViewMechanicsComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'mechanics' },
          },
          {
            path: 'mechanics/add',
            loadComponent: () =>
              import('./pages/mechanics/add-mechanic.component').then(
                (m) => m.AddMechanicComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'mechanics' },
          },
          {
            path: 'repair-orders',
            loadComponent: () =>
              import('./pages/repair-orders/view-repair-orders.component').then(
                (m) => m.ViewRepairOrdersComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'repair-orders' },
          },
          {
            path: 'repair-orders/add',
            loadComponent: () =>
              import('./pages/repair-orders/add-repair-order.component').then(
                (m) => m.AddRepairOrderComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'repair-orders' },
          },
          {
            path: 'repair-orders/:id',
            loadComponent: () =>
              import('./pages/repair-orders/order-detail.component').then(
                (m) => m.OrderDetailComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'repair-orders' },
          },
          {
            path: 'repair-orders/:id/invoice',
            loadComponent: () =>
              import('./pages/repair-orders/invoice.component').then(
                (m) => m.InvoiceComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'repair-orders' },
          },
          {
            path: 'payments',
            loadComponent: () =>
              import('./pages/payments/view-payments.component').then(
                (m) => m.ViewPaymentsComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'payments' },
          },
          {
            path: 'payments/add',
            loadComponent: () =>
              import('./pages/payments/add-payment.component').then(
                (m) => m.AddPaymentComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'payments' },
          },
          {
            path: 'payments/:id/invoice',
            loadComponent: () =>
              import('./pages/payments/payment-invoice.component').then(
                (m) => m.PaymentInvoiceComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'payments' },
          },
          {
            path: 'currencies',
            loadComponent: () =>
              import('./pages/currencies/view-currencies.component').then(
                (m) => m.ViewCurrenciesComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'admin' },
          },
          {
            path: 'currencies/add',
            loadComponent: () =>
              import('./pages/currencies/add-currency.component').then(
                (m) => m.AddCurrencyComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'admin' },
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./pages/settings/settings.component').then(
                (m) => m.SettingsComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'admin' },
          },
          {
            path: 'subscription-manage',
            loadComponent: () =>
              import('./pages/subscription/subscription-manage.component').then(
                (m) => m.SubscriptionManageComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'admin' },
          },
          {
            path: 'tenants',
            loadComponent: () =>
              import('./pages/tenants/tenant-admin.component').then(
                (m) => m.TenantAdminComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'superAdmin' },
          },
          {
            path: 'users',
            loadComponent: () =>
              import('./pages/users/view-users.component').then(
                (m) => m.ViewUsersComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'admin' },
          },
          {
            path: 'users/add',
            loadComponent: () =>
              import('./pages/users/add-user.component').then(
                (m) => m.AddUserComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'admin' },
          },
          {
            path: 'users/:id/edit',
            loadComponent: () =>
              import('./pages/users/add-user.component').then(
                (m) => m.AddUserComponent,
              ),
            canActivate: [roleGuard],
            data: { section: 'admin' },
          },
          {
            path: 'user-guide',
            loadComponent: () =>
              import('./pages/user-guide/user-guide.component').then(
                (m) => m.UserGuideComponent,
              ),
          },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: '**', redirectTo: 'landing' },
];

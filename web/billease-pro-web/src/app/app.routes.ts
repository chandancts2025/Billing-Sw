import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { settingsUnsavedGuard } from './features/settings/settings-unsaved.guard';

export const routes: Routes = [
  { path: 'login', redirectTo: 'auth/login' },
  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'setup', canActivate: [authGuard, roleGuard], data: { role: 'SuperAdmin' }, loadComponent: () => import('./features/auth/shop-setup.component').then(m => m.ShopSetupComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'login' }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'pos', pathMatch: 'full', redirectTo: 'billing/new' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'billing/new', loadComponent: () => import('./features/billing/billing-new.component').then(m => m.BillingNewComponent) },
      { path: 'billing/history', loadComponent: () => import('./features/billing/billing-history.component').then(m => m.BillingHistoryComponent) },
      { path: 'billing/returns', loadComponent: () => import('./features/billing/billing-returns.component').then(m => m.BillingReturnsComponent) },
      { path: 'billing/returns/:id', loadComponent: () => import('./features/billing/billing-returns.component').then(m => m.BillingReturnsComponent) },
      { path: 'billing/:id', loadComponent: () => import('./features/billing/billing-detail.component').then(m => m.BillingDetailComponent) },
      { path: 'inventory', loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent) },
      { path: 'inventory/products', loadComponent: () => import('./features/inventory/inventory-products.component').then(m => m.InventoryProductsComponent) },
      { path: 'inventory/products/new', canActivate: [roleGuard], data: { role: 'Admin' }, loadComponent: () => import('./features/inventory/inventory-products.component').then(m => m.InventoryProductsComponent) },
      { path: 'inventory/products/:id/edit', canActivate: [roleGuard], data: { role: 'Admin' }, loadComponent: () => import('./features/inventory/inventory-products.component').then(m => m.InventoryProductsComponent) },
      { path: 'inventory/categories', loadComponent: () => import('./features/inventory/inventory-categories.component').then(m => m.InventoryCategoriesComponent) },
      { path: 'inventory/purchases', loadComponent: () => import('./features/inventory/inventory-purchases.component').then(m => m.InventoryPurchasesComponent) },
      { path: 'inventory/suppliers', loadComponent: () => import('./features/inventory/inventory-suppliers.component').then(m => m.InventorySuppliersComponent) },
      { path: 'inventory/adjustments', loadComponent: () => import('./features/inventory/inventory-adjustments.component').then(m => m.InventoryAdjustmentsComponent) },
      { path: 'purchase/orders', canActivate: [roleGuard], data: { role: 'Admin' }, loadComponent: () => import('./features/purchase/purchase-orders.component').then(m => m.PurchaseOrdersComponent) },
      { path: 'purchase/orders/new', canActivate: [roleGuard], data: { role: 'Admin' }, loadComponent: () => import('./features/purchase/purchase-orders.component').then(m => m.PurchaseOrdersComponent) },
      { path: 'purchase/grn', canActivate: [roleGuard], data: { role: 'Admin' }, loadComponent: () => import('./features/purchase/grn.component').then(m => m.GrnComponent) },
      { path: 'purchase/suppliers', canActivate: [roleGuard], data: { role: 'Admin' }, loadComponent: () => import('./features/purchase/suppliers.component').then(m => m.SuppliersComponent) },
      { path: 'purchase/returns', canActivate: [roleGuard], data: { role: 'Admin' }, loadComponent: () => import('./features/purchase/purchase-returns.component').then(m => m.PurchaseReturnsComponent) },
      { path: 'customers', loadComponent: () => import('./features/customers/customers.component').then(m => m.CustomersComponent) },
      { path: 'customers/:id', loadComponent: () => import('./features/customers/customer-detail.component').then(m => m.CustomerDetailComponent) },
      { path: 'reports', canActivate: [roleGuard], data: { role: 'Operator' }, loadComponent: () => import('./features/reports/reports-workspace.component').then(m => m.ReportsWorkspaceComponent) },
      { path: 'reports/sales', canActivate: [roleGuard], data: { role: 'Operator' }, loadComponent: () => import('./features/reports/reports-workspace.component').then(m => m.ReportsWorkspaceComponent) },
      { path: 'reports/purchases', canActivate: [roleGuard], data: { role: 'Admin' }, loadComponent: () => import('./features/reports/reports-workspace.component').then(m => m.ReportsWorkspaceComponent) },
      { path: 'reports/inventory', canActivate: [roleGuard], data: { role: 'Operator' }, loadComponent: () => import('./features/reports/reports-workspace.component').then(m => m.ReportsWorkspaceComponent) },
      { path: 'reports/tax', canActivate: [roleGuard], data: { role: 'Admin' }, loadComponent: () => import('./features/reports/reports-workspace.component').then(m => m.ReportsWorkspaceComponent) },
      { path: 'reports/accounts', canActivate: [roleGuard], data: { role: 'Admin' }, loadComponent: () => import('./features/reports/reports-workspace.component').then(m => m.ReportsWorkspaceComponent) },
      { path: 'reports/analytics', canActivate: [roleGuard], data: { role: 'Admin' }, loadComponent: () => import('./features/reports/reports-workspace.component').then(m => m.ReportsWorkspaceComponent) },
      { path: 'reports/dashboard', canActivate: [roleGuard], data: { role: 'Admin' }, loadComponent: () => import('./features/reports/reports-workspace.component').then(m => m.ReportsWorkspaceComponent) },
      { path: 'settings', pathMatch: 'full', redirectTo: 'settings/shop' },
      { path: 'settings/:section', canActivate: [roleGuard], canDeactivate: [settingsUnsavedGuard], data: { role: 'Admin' }, loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];

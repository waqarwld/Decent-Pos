import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'pos', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },

  {
    path: 'pos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pos/pos-shell/pos-shell.component').then(m => m.PosShellComponent),
  },

  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      // Products
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/products/product-list/product-list.component').then(m => m.ProductListComponent),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./features/admin/products/product-form/product-form.component').then(m => m.ProductFormComponent),
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./features/admin/products/product-form/product-form.component').then(m => m.ProductFormComponent),
      },

      // Categories
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/categories/category-list/category-list.component').then(m => m.CategoryListComponent),
      },
      {
        path: 'categories/new',
        loadComponent: () =>
          import('./features/admin/categories/category-form/category-form.component').then(m => m.CategoryFormComponent),
      },
      {
        path: 'categories/:id/edit',
        loadComponent: () =>
          import('./features/admin/categories/category-form/category-form.component').then(m => m.CategoryFormComponent),
      },

      // Locations
      {
        path: 'locations',
        loadComponent: () =>
          import('./features/admin/locations/location-list/location-list.component').then(m => m.LocationListComponent),
      },
      {
        path: 'locations/new',
        loadComponent: () =>
          import('./features/admin/locations/location-form/location-form.component').then(m => m.LocationFormComponent),
      },
      {
        path: 'locations/:id/edit',
        loadComponent: () =>
          import('./features/admin/locations/location-form/location-form.component').then(m => m.LocationFormComponent),
      },

      // Suppliers
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./features/admin/suppliers/supplier-list/supplier-list.component').then(m => m.SupplierListComponent),
      },
      {
        path: 'suppliers/new',
        loadComponent: () =>
          import('./features/admin/suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
      },
      {
        path: 'suppliers/:id/edit',
        loadComponent: () =>
          import('./features/admin/suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
      },

      // Inventory
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/admin/inventory/inventory-list/inventory-list.component').then(m => m.InventoryListComponent),
      },
      {
        path: 'inventory/receive',
        loadComponent: () =>
          import('./features/admin/inventory/receive-form/receive-form.component').then(m => m.ReceiveFormComponent),
      },
      {
        path: 'inventory/ship',
        loadComponent: () =>
          import('./features/admin/inventory/ship-form/ship-form.component').then(m => m.ShipFormComponent),
      },
      {
        path: 'inventory/transfer',
        loadComponent: () =>
          import('./features/admin/inventory/transfer-form/transfer-form.component').then(m => m.TransferFormComponent),
      },
      {
        path: 'inventory/adjust',
        loadComponent: () =>
          import('./features/admin/inventory/adjust-form/adjust-form.component').then(m => m.AdjustFormComponent),
      },

      // Reports
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/reports/reports-dashboard/reports-dashboard.component').then(m => m.ReportsDashboardComponent),
      },
      {
        path: 'reports/stock',
        loadComponent: () =>
          import('./features/admin/reports/stock-report/stock-report.component').then(m => m.StockReportComponent),
      },
      {
        path: 'reports/alerts',
        loadComponent: () =>
          import('./features/admin/reports/alerts-report/alerts-report.component').then(m => m.AlertsReportComponent),
      },
      {
        path: 'reports/valuation',
        loadComponent: () =>
          import('./features/admin/reports/valuation-report/valuation-report.component').then(m => m.ValuationReportComponent),
      },
      {
        path: 'reports/turnover',
        loadComponent: () =>
          import('./features/admin/reports/turnover-report/turnover-report.component').then(m => m.TurnoverReportComponent),
      },
      {
        path: 'reports/suppliers',
        loadComponent: () =>
          import('./features/admin/reports/supplier-performance/supplier-performance.component').then(m => m.SupplierPerformanceComponent),
      },
      {
        path: 'reports/movements',
        loadComponent: () =>
          import('./features/admin/reports/recent-movements/recent-movements.component').then(m => m.RecentMovementsComponent),
      },
      {
        path: 'reports/aging',
        loadComponent: () =>
          import('./features/admin/reports/aging-report/aging-report.component').then(m => m.AgingReportComponent),
      },
    ],
  },
];

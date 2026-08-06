import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { LocationService } from '../../../core/services/location.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ReportService } from '../../../core/services/report.service';
import { InventoryService } from '../../../core/services/inventory.service';

interface KpiCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  link: string;
}

interface QuickAction {
  label: string;
  icon: string;
  link: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 space-y-8">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p class="text-sm text-gray-500 mt-1">System overview and quick actions</p>
      </div>

      <!-- Error -->
      @if (error()) {
        <div class="px-4 py-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700" role="alert">
          {{ error() }}
        </div>
      }

      <!-- KPI Cards -->
      @if (loading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          @for (_ of [1,2,3,4,5,6]; track $index) {
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 animate-pulse">
              <div class="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div class="h-7 bg-gray-200 rounded w-1/2"></div>
            </div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          @for (card of kpiCards(); track card.label) {
            <a [routerLink]="card.link"
              class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md hover:border-blue-200 transition group block">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xl">{{ card.icon }}</span>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full" [class]="card.color">
                  →
                </span>
              </div>
              <p class="text-xs text-gray-500 font-medium">{{ card.label }}</p>
              <p class="text-2xl font-bold text-gray-800 mt-1 group-hover:text-blue-600 transition">
                {{ card.value }}
              </p>
            </a>
          }
        </div>
      }

      <!-- Quick Actions -->
      <div>
        <h2 class="text-base font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          @for (action of quickActions; track action.label) {
            <a [routerLink]="action.link"
              class="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition group">
              <span class="text-xl">{{ action.icon }}</span>
              <span class="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition">
                {{ action.label }}
              </span>
            </a>
          }
        </div>
      </div>

      <!-- Recent Activity -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-gray-700">Recent Inventory Movements</h2>
          <a routerLink="/admin/inventory" class="text-sm text-blue-600 hover:underline">View all →</a>
        </div>

        @if (loadingMovements()) {
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-sm text-gray-400">
            Loading…
          </div>
        } @else if (recentMovements().length === 0) {
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-sm text-gray-400">
            No recent movements.
          </div>
        } @else {
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <table class="min-w-full divide-y divide-gray-100 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th class="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">By</th>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (m of recentMovements(); track m.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2.5 text-gray-400 text-xs">{{ m.id }}</td>
                    <td class="px-4 py-2.5">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        [class]="movementTypeColor(m.movement_type_id)">
                        {{ movementTypeLabel(m.movement_type_id) }}
                      </span>
                    </td>
                    <td class="px-4 py-2.5 text-gray-700">
                      <a [routerLink]="['/admin/products', m.product_id, 'edit']"
                        class="text-blue-600 hover:underline">#{{ m.product_id }}</a>
                    </td>
                    <td class="px-4 py-2.5 text-right text-gray-700">{{ m.quantity }}</td>
                    <td class="px-4 py-2.5 text-gray-500 text-xs">{{ m.created_by }}</td>
                    <td class="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{{ m.created_at | date:'short' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly locationService = inject(LocationService);
  private readonly supplierService = inject(SupplierService);
  private readonly reportService = inject(ReportService);
  private readonly inventoryService = inject(InventoryService);

  readonly loading = signal(true);
  readonly loadingMovements = signal(true);
  readonly error = signal<string | null>(null);
  readonly kpiCards = signal<KpiCard[]>([]);
  readonly recentMovements = signal<any[]>([]);

  readonly quickActions: QuickAction[] = [
    { label: 'New Product',    icon: '➕', link: '/admin/products/new',         color: 'text-blue-600' },
    { label: 'Receive Stock',  icon: '📥', link: '/admin/inventory/receive',    color: 'text-green-600' },
    { label: 'Ship Stock',     icon: '📤', link: '/admin/inventory/ship',       color: 'text-orange-600' },
    { label: 'Transfer Stock', icon: '🔄', link: '/admin/inventory/transfer',   color: 'text-indigo-600' },
    { label: 'Adjust Stock',   icon: '⚖️', link: '/admin/inventory/adjust',    color: 'text-amber-600' },
    { label: 'Stock Alerts',   icon: '⚠️', link: '/admin/reports/alerts',      color: 'text-red-600' },
    { label: 'Valuation',      icon: '💰', link: '/admin/reports/valuation',   color: 'text-emerald-600' },
    { label: 'All Reports',    icon: '📊', link: '/admin/reports',             color: 'text-purple-600' },
  ];

  private readonly MOVEMENT_TYPES: Record<number, { label: string; color: string }> = {
    1: { label: 'Receipt',      color: 'bg-green-100 text-green-700' },
    2: { label: 'Sale',         color: 'bg-blue-100 text-blue-700' },
    3: { label: 'Transfer In',  color: 'bg-indigo-100 text-indigo-700' },
    4: { label: 'Transfer Out', color: 'bg-purple-100 text-purple-700' },
    5: { label: 'Adj +',        color: 'bg-amber-100 text-amber-700' },
    6: { label: 'Adj −',        color: 'bg-orange-100 text-orange-700' },
    7: { label: 'Return',       color: 'bg-teal-100 text-teal-700' },
    8: { label: 'Damage',       color: 'bg-red-100 text-red-700' },
  };

  movementTypeLabel(id: number): string {
    return this.MOVEMENT_TYPES[id]?.label ?? `Type ${id}`;
  }

  movementTypeColor(id: number): string {
    return this.MOVEMENT_TYPES[id]?.color ?? 'bg-gray-100 text-gray-700';
  }

  ngOnInit(): void {
    this.loadKpis();
    this.loadRecentMovements();
  }

  private loadKpis(): void {
    forkJoin({
      products:   this.productService.getAll(1, 1),
      categories: this.categoryService.getAll(),
      locations:  this.locationService.getAll(),
      suppliers:  this.supplierService.getAll(),
      alerts:     this.reportService.getAlerts(),
    }).subscribe({
      next: ({ products, categories, locations, suppliers, alerts }) => {
        this.kpiCards.set([
          { label: 'Products',    value: products.total,        icon: '📦', color: 'bg-blue-50 text-blue-600',    link: '/admin/products' },
          { label: 'Categories',  value: categories.length,     icon: '📁', color: 'bg-violet-50 text-violet-600', link: '/admin/categories' },
          { label: 'Locations',   value: locations.length,      icon: '📍', color: 'bg-teal-50 text-teal-600',    link: '/admin/locations' },
          { label: 'Suppliers',   value: suppliers.length,      icon: '🏭', color: 'bg-orange-50 text-orange-600', link: '/admin/suppliers' },
          { label: 'Low Stock',   value: alerts.length,         icon: '⚠️', color: alerts.length > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600', link: '/admin/reports/alerts' },
          { label: 'Reports',     value: '7',                   icon: '📊', color: 'bg-purple-50 text-purple-600', link: '/admin/reports' },
        ]);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load dashboard data.');
        this.loading.set(false);
      },
    });
  }

  private loadRecentMovements(): void {
    this.inventoryService.getMovements().subscribe({
      next: (data) => {
        this.recentMovements.set(data.slice(0, 8));
        this.loadingMovements.set(false);
      },
      error: () => {
        this.loadingMovements.set(false);
      },
    });
  }
}

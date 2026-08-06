import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ReportService } from '../../../../core/services/report.service';
import { ProductStockSummary } from '../../../../core/models/reports';

interface SummaryData {
  totalProducts: number;
  totalInventoryValue: number;
  lowStockItems: number;
}

interface ReportLink {
  title: string;
  description: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Reports</h1>
        <p class="text-sm text-gray-500 mt-1">Inventory analytics and insights</p>
      </div>

      <!-- Error -->
      @if (error()) {
        <div
          class="mb-4 px-4 py-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700"
          role="alert"
        >
          {{ error() }}
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center items-center py-12">
          <span class="text-gray-500 text-sm">Loading summary…</span>
        </div>
      } @else {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <!-- Total Products -->
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Products</p>
            <p class="mt-2 text-3xl font-bold text-gray-800">{{ summary().totalProducts | number }}</p>
          </div>

          <!-- Total Inventory Value -->
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Inventory Value</p>
            <p class="mt-2 text-3xl font-bold text-gray-800">{{ summary().totalInventoryValue | currency }}</p>
          </div>

          <!-- Low Stock Items -->
          <div
            class="bg-white rounded-lg border shadow-sm p-5"
            [class.border-amber-400]="summary().lowStockItems > 0"
            [class.border-gray-200]="summary().lowStockItems === 0"
          >
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Low Stock Items</p>
            <p
              class="mt-2 text-3xl font-bold"
              [class.text-amber-600]="summary().lowStockItems > 0"
              [class.text-gray-800]="summary().lowStockItems === 0"
            >
              {{ summary().lowStockItems | number }}
            </p>
          </div>
        </div>

        <!-- Report Navigation Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          @for (link of reportLinks; track link.route) {
            <a
              [routerLink]="link.route"
              class="block bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition group"
            >
              <div class="flex items-center gap-3 mb-2">
                <span class="text-2xl">{{ link.icon }}</span>
                <h3 class="font-semibold text-gray-800 group-hover:text-blue-600 transition">
                  {{ link.title }}
                </h3>
              </div>
              <p class="text-sm text-gray-500">{{ link.description }}</p>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class ReportsDashboardComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly summary = signal<SummaryData>({ totalProducts: 0, totalInventoryValue: 0, lowStockItems: 0 });

  readonly reportLinks: ReportLink[] = [
    { title: 'Stock Report', description: 'Current stock levels by product and location', route: '/admin/reports/stock', icon: '📦' },
    { title: 'Low Stock Alerts', description: 'Items below reorder point', route: '/admin/reports/alerts', icon: '⚠️' },
    { title: 'Inventory Valuation', description: 'Stock value using average cost', route: '/admin/reports/valuation', icon: '💰' },
    { title: 'Inventory Turnover', description: 'Movement frequency analysis', route: '/admin/reports/turnover', icon: '🔄' },
    { title: 'Supplier Performance', description: 'Delivery times and quality metrics', route: '/admin/reports/suppliers', icon: '🏭' },
    { title: 'Recent Movements', description: 'Latest inventory transactions', route: '/admin/reports/movements', icon: '📋' },
    { title: 'Stock Aging', description: 'Days in stock analysis', route: '/admin/reports/aging', icon: '📅' },
  ];

  ngOnInit(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      summary: this.reportService.getSummary(1, 100),
      alerts: this.reportService.getAlerts(),
    }).subscribe({
      next: ({ summary, alerts }) => {
        const data = summary.data;
        let totalProducts = 0;
        let totalValue = 0;

        if (data && data.length > 0) {
          totalProducts = data.reduce((sum, item) => sum + (item.location_count || 0), 0);
          totalValue = data.reduce((sum, item) => sum + (item.total_inventory_value_cost || 0), 0);
        }

        this.summary.set({
          totalProducts: summary.total || totalProducts,
          totalInventoryValue: totalValue,
          lowStockItems: alerts.length,
        });
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load summary.');
        this.loading.set(false);
      },
    });
  }
}
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../../../core/services/report.service';
import { LowStockAlert } from '../../../../core/models/reports';

@Component({
  selector: 'app-alerts-report',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <a
          routerLink="/admin/reports"
          class="text-gray-500 hover:text-gray-700 transition"
          aria-label="Back to reports"
        >
          ← Back
        </a>
        <h1 class="text-2xl font-bold text-gray-800">Low Stock Alerts</h1>
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
          <span class="text-gray-500 text-sm">Loading alerts…</span>
        </div>
      } @else {
        <!-- Table -->
        <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Product ID</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">SKU</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Product Name</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Location Code</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Available</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Reorder Point</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Units Below Reorder</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Stock Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              @if (alerts().length === 0) {
                <tr>
                  <td colspan="8" class="px-4 py-8 text-center text-gray-400">No low stock alerts.</td>
                </tr>
              }
              @for (alert of alerts(); track alert.product_id + '-' + alert.location_code) {
                <tr
                  class="hover:bg-gray-50 transition-colors"
                  [class.bg-amber-50]="alert.units_below_reorder > 0"
                >
                  <td class="px-4 py-3 text-gray-500">{{ alert.product_id }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ alert.sku }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800">{{ alert.product_name }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ alert.location_code }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ alert.quantity_available | number }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ alert.reorder_point | number }}</td>
                  <td
                    class="px-4 py-3 text-right font-semibold"
                    [class.text-amber-600]="alert.units_below_reorder > 0"
                    [class.text-gray-700]="alert.units_below_reorder <= 0"
                  >
                    {{ alert.units_below_reorder | number }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      [class.bg-red-100]="alert.units_below_reorder > 0"
                      [class.text-red-700]="alert.units_below_reorder > 0"
                      [class.bg-green-100]="alert.units_below_reorder <= 0"
                      [class.text-green-700]="alert.units_below_reorder <= 0"
                    >
                      {{ alert.stock_status }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AlertsReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly alerts = signal<LowStockAlert[]>([]);

  ngOnInit(): void {
    this.loadAlerts();
  }

  private loadAlerts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reportService.getAlerts().subscribe({
      next: (data) => {
        this.alerts.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load alerts.');
        this.loading.set(false);
      },
    });
  }
}
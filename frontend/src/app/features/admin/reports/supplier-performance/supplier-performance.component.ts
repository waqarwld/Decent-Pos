import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../../../core/services/report.service';
import { SupplierPerformance } from '../../../../core/models/reports';

@Component({
  selector: 'app-supplier-performance',
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
        <h1 class="text-2xl font-bold text-gray-800">Supplier Performance</h1>
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
          <span class="text-gray-500 text-sm">Loading supplier performance…</span>
        </div>
      } @else {
        <!-- Table -->
        <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Supplier ID</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Supplier Name</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Products Supplied</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Avg Delivery Days</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">On-Time Rate</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Avg Quality</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              @if (suppliers().length === 0) {
                <tr>
                  <td colspan="6" class="px-4 py-8 text-center text-gray-400">No supplier performance data found.</td>
                </tr>
              }
              @for (supplier of suppliers(); track supplier.supplier_id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 text-gray-500">{{ supplier.supplier_id }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800">{{ supplier.supplier_name }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ supplier.products_supplied | number }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ supplier.avg_delivery_days | number:'1.1-1' }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ (supplier.on_time_rate * 100) | number:'1.1-1' }}%</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ supplier.avg_quality | number:'1.1-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class SupplierPerformanceComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly suppliers = signal<SupplierPerformance[]>([]);

  ngOnInit(): void {
    this.loadSupplierPerformance();
  }

  private loadSupplierPerformance(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reportService.getSupplierPerformance().subscribe({
      next: (data) => {
        this.suppliers.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load supplier performance.');
        this.loading.set(false);
      },
    });
  }
}
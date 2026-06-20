import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../../../core/services/report.service';
import { AgingRecord } from '../../../../core/models/reports';

@Component({
  selector: 'app-aging-report',
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
        <h1 class="text-2xl font-bold text-gray-800">Stock Aging</h1>
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
          <span class="text-gray-500 text-sm">Loading aging report…</span>
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
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Qty On Hand</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Days In Stock</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Aging Bucket</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              @if (records().length === 0) {
                <tr>
                  <td colspan="7" class="px-4 py-8 text-center text-gray-400">No aging data found.</td>
                </tr>
              }
              @for (record of records(); track record.product_id + '-' + record.location_code) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 text-gray-500">{{ record.product_id }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ record.sku }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800">{{ record.product_name }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ record.location_code }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ record.quantity_on_hand | number }}</td>
                  <td
                    class="px-4 py-3 text-right font-medium"
                    [class.text-red-600]="record.days_in_stock > 90"
                    [class.text-amber-600]="record.days_in_stock > 30 && record.days_in_stock <= 90"
                    [class.text-gray-700]="record.days_in_stock <= 30"
                  >
                    {{ record.days_in_stock | number }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      [class.bg-green-100]="record.aging_bucket === '0-30'"
                      [class.text-green-700]="record.aging_bucket === '0-30'"
                      [class.bg-amber-100]="record.aging_bucket === '31-60'"
                      [class.text-amber-700]="record.aging_bucket === '31-60'"
                      [class.bg-orange-100]="record.aging_bucket === '61-90'"
                      [class.text-orange-700]="record.aging_bucket === '61-90'"
                      [class.bg-red-100]="record.aging_bucket === '90+'"
                      [class.text-red-700]="record.aging_bucket === '90+'"
                    >
                      {{ record.aging_bucket }}
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
export class AgingReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly records = signal<AgingRecord[]>([]);

  ngOnInit(): void {
    this.loadAging();
  }

  private loadAging(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reportService.getAging().subscribe({
      next: (data) => {
        this.records.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load aging report.');
        this.loading.set(false);
      },
    });
  }
}
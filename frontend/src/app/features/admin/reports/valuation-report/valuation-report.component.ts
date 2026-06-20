import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../../../core/services/report.service';
import { ValuationRecord } from '../../../../core/models/reports';

@Component({
  selector: 'app-valuation-report',
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
        <h1 class="text-2xl font-bold text-gray-800">Inventory Valuation</h1>
      </div>

      <!-- Total Value Summary -->
      @if (!loading() && !error()) {
        <div class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm font-medium text-blue-600 uppercase tracking-wide">Total Inventory Value</p>
          <p class="mt-1 text-3xl font-bold text-blue-700">{{ totalValue() | currency }}</p>
        </div>
      }

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
          <span class="text-gray-500 text-sm">Loading valuation…</span>
        </div>
      } @else {
        <!-- Table -->
        <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Product ID</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Location ID</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Quantity On Hand</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Average Unit Cost</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Value</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              @if (records().length === 0) {
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-gray-400">No valuation data found.</td>
                </tr>
              }
              @for (record of records(); track record.product_id + '-' + record.location_id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 text-gray-500">{{ record.product_id }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ record.location_id }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ record.quantity_on_hand | number }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ record.average_unit_cost | currency }}</td>
                  <td class="px-4 py-3 text-right font-medium text-gray-800">{{ record.value | currency }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class ValuationReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly records = signal<ValuationRecord[]>([]);

  totalValue(): number {
    return this.records().reduce((sum, r) => sum + (r.value || 0), 0);
  }

  ngOnInit(): void {
    this.loadValuation();
  }

  private loadValuation(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reportService.getValuation().subscribe({
      next: (data) => {
        this.records.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load valuation.');
        this.loading.set(false);
      },
    });
  }
}
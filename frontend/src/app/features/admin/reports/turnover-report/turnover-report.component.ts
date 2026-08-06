import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../../../core/services/report.service';
import { TurnoverItem } from '../../../../core/models/reports';

@Component({
  selector: 'app-turnover-report',
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
        <h1 class="text-2xl font-bold text-gray-800">Inventory Turnover</h1>
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
          <span class="text-gray-500 text-sm">Loading turnover report…</span>
        </div>
      } @else {
        <!-- Table -->
        <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Product ID</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Product Name</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Movement Count</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              @if (items().length === 0) {
                <tr>
                  <td colspan="3" class="px-4 py-8 text-center text-gray-400">No turnover data found.</td>
                </tr>
              }
              @for (item of items(); track item.product_id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 text-gray-500">{{ item.product_id }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800">{{ item.product_name }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ item.movement_count | number }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class TurnoverReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<TurnoverItem[]>([]);

  ngOnInit(): void {
    this.loadTurnover();
  }

  private loadTurnover(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reportService.getTurnover().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load turnover report.');
        this.loading.set(false);
      },
    });
  }
}
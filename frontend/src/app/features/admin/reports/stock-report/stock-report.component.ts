import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../../../core/services/report.service';
import { StockLevel } from '../../../../core/models/reports';
import { PaginatedResponse } from '../../../../core/models/product';

@Component({
  selector: 'app-stock-report',
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
        <h1 class="text-2xl font-bold text-gray-800">Stock Report</h1>
      </div>

      <!-- Page Info -->
      @if (!loading() && !error()) {
        <p class="text-sm text-gray-500 mb-4">
          Showing {{ stockLevels().length }} of {{ totalItems() }} items
          (Page {{ currentPage() }} of {{ totalPages() }})
        </p>
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
          <span class="text-gray-500 text-sm">Loading stock report…</span>
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
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Location Name</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Qty On Hand</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Qty Available</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Qty Reserved</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              @if (stockLevels().length === 0) {
                <tr>
                  <td colspan="8" class="px-4 py-8 text-center text-gray-400">No stock data found.</td>
                </tr>
              }
              @for (item of stockLevels(); track item.product_id + '-' + item.location_id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 text-gray-500">{{ item.product_id }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ item.sku }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800">{{ item.product_name }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ item.location_code }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ item.location_name }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ item.quantity_on_hand | number }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ item.quantity_available | number }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ item.quantity_reserved | number }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex items-center justify-between mt-4">
            <button
              (click)="prevPage()"
              [disabled]="currentPage() <= 1"
              class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span class="text-sm text-gray-500">Page {{ currentPage() }} of {{ totalPages() }}</span>
            <button
              (click)="nextPage()"
              [disabled]="currentPage() >= totalPages()"
              class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class StockReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly stockLevels = signal<StockLevel[]>([]);
  readonly currentPage = signal(1);
  readonly pageSize = signal(50);
  readonly totalItems = signal(0);

  totalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize()) || 1;
  }

  ngOnInit(): void {
    this.loadStock();
  }

  private loadStock(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reportService.getStock(undefined, undefined, this.currentPage(), this.pageSize()).subscribe({
      next: (response: PaginatedResponse<StockLevel>) => {
        this.stockLevels.set(response.data);
        this.totalItems.set(response.total);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load stock report.');
        this.loading.set(false);
      },
    });
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadStock();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadStock();
    }
  }
}
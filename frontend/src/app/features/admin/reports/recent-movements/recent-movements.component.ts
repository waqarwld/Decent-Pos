import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../../../core/services/report.service';
import { InventoryMovement } from '../../../../core/models/inventory';
import { PaginatedResponse } from '../../../../core/models/product';

const MOVEMENT_TYPE_MAP: Record<number, { label: string; color: string }> = {
  1: { label: 'Receipt',      color: 'bg-green-100 text-green-800' },
  2: { label: 'Sale',         color: 'bg-blue-100 text-blue-800' },
  3: { label: 'Transfer In',  color: 'bg-indigo-100 text-indigo-800' },
  4: { label: 'Transfer Out', color: 'bg-purple-100 text-purple-800' },
  5: { label: 'Adj +',        color: 'bg-amber-100 text-amber-800' },
  6: { label: 'Adj −',        color: 'bg-orange-100 text-orange-800' },
  7: { label: 'Return',       color: 'bg-teal-100 text-teal-800' },
  8: { label: 'Damage',       color: 'bg-red-100 text-red-800' },
};

@Component({
  selector: 'app-recent-movements',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/admin/reports" class="text-gray-500 hover:text-gray-700 transition" aria-label="Back to reports">
          ← Back
        </a>
        <h1 class="text-2xl font-bold text-gray-800">Recent Movements</h1>
      </div>

      @if (!loading() && !error()) {
        <p class="text-sm text-gray-500 mb-4">
          Showing {{ movements().length }} of {{ totalItems() }} items
          (Page {{ currentPage() }} of {{ totalPages() }})
        </p>
      }

      @if (error()) {
        <div class="mb-4 px-4 py-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700" role="alert">
          {{ error() }}
        </div>
      }

      @if (loading()) {
        <div class="flex justify-center items-center py-12">
          <span class="text-gray-500 text-sm">Loading movements…</span>
        </div>
      } @else {
        <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">ID</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Type</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Product ID</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Qty</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Unit Cost</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Location</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Reference</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Created By</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Date</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              @if (movements().length === 0) {
                <tr>
                  <td colspan="9" class="px-4 py-8 text-center text-gray-400">No movements found.</td>
                </tr>
              }
              @for (m of movements(); track m.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 text-gray-500">{{ m.id }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      [class]="typeInfo(m.movement_type_id).color">
                      {{ typeInfo(m.movement_type_id).label }}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-medium text-gray-800">
                    <a [routerLink]="['/admin/products', m.product_id, 'edit']" class="text-blue-600 hover:underline">
                      #{{ m.product_id }}
                    </a>
                  </td>
                  <td class="px-4 py-3 text-right text-gray-700" [class.text-red-600]="m.quantity < 0">
                    {{ m.quantity | number }}
                  </td>
                  <td class="px-4 py-3 text-right text-gray-500">
                    {{ m.unit_cost != null ? (m.unit_cost | currency) : '—' }}
                  </td>
                  <td class="px-4 py-3 text-gray-500">{{ m.location_id ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-500 max-w-[160px] truncate" [title]="m.reference_document ?? ''">
                    {{ m.reference_document ?? '—' }}
                  </td>
                  <td class="px-4 py-3 text-gray-500">{{ m.created_by }}</td>
                  <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ m.created_at | date:'short' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-between mt-4">
            <button (click)="prevPage()" [disabled]="currentPage() <= 1"
              class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
              Previous
            </button>
            <span class="text-sm text-gray-500">Page {{ currentPage() }} of {{ totalPages() }}</span>
            <button (click)="nextPage()" [disabled]="currentPage() >= totalPages()"
              class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
              Next
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class RecentMovementsComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly movements = signal<InventoryMovement[]>([]);
  readonly currentPage = signal(1);
  readonly pageSize = signal(50);
  readonly totalItems = signal(0);

  typeInfo(typeId: number): { label: string; color: string } {
    return MOVEMENT_TYPE_MAP[typeId] ?? { label: `Type ${typeId}`, color: 'bg-gray-100 text-gray-700' };
  }

  totalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize()) || 1;
  }

  ngOnInit(): void {
    this.loadMovements();
  }

  private loadMovements(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reportService.getRecentMovements(this.currentPage(), this.pageSize()).subscribe({
      next: (response: PaginatedResponse<InventoryMovement>) => {
        this.movements.set(response.data);
        this.totalItems.set(response.total);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load movements.');
        this.loading.set(false);
      },
    });
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadMovements();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadMovements();
    }
  }
}

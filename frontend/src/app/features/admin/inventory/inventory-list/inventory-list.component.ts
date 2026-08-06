import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InventoryService } from '../../../../core/services/inventory.service';
import { InventoryMovement } from '../../../../core/models/inventory';

// Movement type ID → label/style mapping (matches movement_types table)
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
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Inventory Movements</h1>
        <div class="flex items-center gap-2">
          <a routerLink="/admin/inventory/receive"
            class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition">
            Receive
          </a>
          <a routerLink="/admin/inventory/ship"
            class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition">
            Ship
          </a>
          <a routerLink="/admin/inventory/transfer"
            class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition">
            Transfer
          </a>
          <a routerLink="/admin/inventory/adjust"
            class="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition">
            Adjust
          </a>
        </div>
      </div>

      <!-- Error -->
      @if (error()) {
        <div class="mb-4 px-4 py-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700" role="alert">
          {{ error() }}
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center items-center py-12">
          <span class="text-gray-500 text-sm">Loading movements…</span>
        </div>
      } @else {
        <!-- Table -->
        <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Type</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Product ID</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Qty</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Unit Cost</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Reference</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Created By</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Date</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              @if (movements().length === 0) {
                <tr>
                  <td colspan="7" class="px-4 py-8 text-center text-gray-400">No inventory movements found.</td>
                </tr>
              }
              @for (m of movements(); track m.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      [class]="typeInfo(m.movement_type_id).color">
                      {{ typeInfo(m.movement_type_id).label }}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-medium text-gray-800">
                    <a [routerLink]="['/admin/products', m.product_id, 'edit']"
                      class="text-blue-600 hover:underline">
                      #{{ m.product_id }}
                    </a>
                  </td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ m.quantity }}</td>
                  <td class="px-4 py-3 text-right text-gray-500">
                    {{ m.unit_cost != null ? (m.unit_cost | currency) : '—' }}
                  </td>
                  <td class="px-4 py-3 text-gray-500 max-w-[180px] truncate" [title]="m.reference_document ?? ''">
                    {{ m.reference_document ?? '—' }}
                  </td>
                  <td class="px-4 py-3 text-gray-500">{{ m.created_by }}</td>
                  <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ m.created_at | date:'short' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class InventoryListComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly movements = signal<InventoryMovement[]>([]);

  typeInfo(typeId: number): { label: string; color: string } {
    return MOVEMENT_TYPE_MAP[typeId] ?? { label: `Type ${typeId}`, color: 'bg-gray-100 text-gray-700' };
  }

  ngOnInit(): void {
    this.loadMovements();
  }

  private loadMovements(): void {
    this.loading.set(true);
    this.error.set(null);
    this.inventoryService.getMovements().subscribe({
      next: (data) => { this.movements.set(data); this.loading.set(false); },
      error: (err: Error) => { this.error.set(err.message ?? 'Failed to load movements.'); this.loading.set(false); },
    });
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InventoryService } from '../../../../core/services/inventory.service';
import { InventoryMovement } from '../../../../core/models/inventory';

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
          <a
            routerLink="/admin/inventory/receive"
            class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Receive
          </a>
          <a
            routerLink="/admin/inventory/ship"
            class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Ship
          </a>
          <a
            routerLink="/admin/inventory/transfer"
            class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Transfer
          </a>
          <a
            routerLink="/admin/inventory/adjust"
            class="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Adjust
          </a>
        </div>
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
          <span class="text-gray-500 text-sm">Loading movements…</span>
        </div>
      } @else {
        <!-- Table -->
        <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  Type
                </th>
                <th
                  class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  Product
                </th>
                <th
                  class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  Quantity
                </th>
                <th
                  class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  Location(s)
                </th>
                <th
                  class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  Reason
                </th>
                <th
                  class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  Created At
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              @if (movements().length === 0) {
                <tr>
                  <td colspan="6" class="px-4 py-8 text-center text-gray-400">
                    No inventory movements found.
                  </td>
                </tr>
              }
              @for (movement of movements(); track movement.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      [class.bg-green-100]="movement.type === 'receive'"
                      [class.text-green-800]="movement.type === 'receive'"
                      [class.bg-blue-100]="movement.type === 'ship'"
                      [class.text-blue-800]="movement.type === 'ship'"
                      [class.bg-indigo-100]="movement.type === 'transfer'"
                      [class.text-indigo-800]="movement.type === 'transfer'"
                      [class.bg-amber-100]="movement.type === 'adjust'"
                      [class.text-amber-800]="movement.type === 'adjust'"
                    >
                      {{ movement.type }}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-medium text-gray-800">{{ movement.product_name }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">
                    {{ movement.type === 'adjust' ? (movement.quantity >= 0 ? '+' : '') : '' }}{{ movement.quantity }}
                  </td>
                  <td class="px-4 py-3 text-gray-500">
                    @if (movement.type === 'transfer') {
                      {{ movement.source_location_id }} → {{ movement.destination_location_id }}
                    } @else if (movement.location_id) {
                      {{ movement.location_id }}
                    } @else {
                      —
                    }
                  </td>
                  <td class="px-4 py-3 text-gray-500">{{ movement.reason ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ movement.created_at | date:'short' }}</td>
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

  ngOnInit(): void {
    this.loadMovements();
  }

  private loadMovements(): void {
    this.loading.set(true);
    this.error.set(null);

    this.inventoryService.getMovements().subscribe({
      next: (data) => {
        this.movements.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load movements.');
        this.loading.set(false);
      },
    });
  }
}
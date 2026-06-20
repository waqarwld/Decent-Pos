import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupplierService } from '../../../../core/services/supplier.service';
import { Supplier } from '../../../../core/models/inventory';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Suppliers</h1>
        <a
          routerLink="/admin/suppliers/new"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + New Supplier
        </a>
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
          <span class="text-gray-500 text-sm">Loading suppliers…</span>
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
                  ID
                </th>
                <th
                  class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  Name
                </th>
                <th
                  class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  Contact Info
                </th>
                <th
                  class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              @if (suppliers().length === 0) {
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-gray-400">
                    No suppliers found.
                  </td>
                </tr>
              }
              @for (supplier of suppliers(); track supplier.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 text-gray-500">{{ supplier.id }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800">{{ supplier.name }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ supplier.contact_info ?? '—' }}</td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <a
                      [routerLink]="['/admin/suppliers', supplier.id, 'edit']"
                      class="inline-block px-3 py-1 text-xs font-semibold text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition"
                    >
                      Edit
                    </a>
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
export class SupplierListComponent implements OnInit {
  private readonly supplierService = inject(SupplierService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly suppliers = signal<Supplier[]>([]);

  ngOnInit(): void {
    this.loadSuppliers();
  }

  private loadSuppliers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.supplierService.getAll().subscribe({
      next: (data) => {
        this.suppliers.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load suppliers.');
        this.loading.set(false);
      },
    });
  }
}

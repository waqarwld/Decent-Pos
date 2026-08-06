import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerService } from '../../../../core/services/customer.service';
import { Customer } from '../../../../core/models/customer';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Customers</h1>
        <a
          routerLink="/admin/customers/new"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + New Customer
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
          <span class="text-gray-500 text-sm">Loading customers…</span>
        </div>
      } @else {
        <!-- Table -->
        <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">ID</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Name</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Type</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Contact</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              @if (customers().length === 0) {
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-gray-400">
                    No customers found.
                  </td>
                </tr>
              }
              @for (customer of customers(); track customer.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 text-gray-500">{{ customer.code }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800">{{ customer.name }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      [class.bg-purple-100]="customer.customer_type === 'wholesale'"
                      [class.text-purple-700]="customer.customer_type === 'wholesale'"
                      [class.bg-green-100]="customer.customer_type === 'retail'"
                      [class.text-green-700]="customer.customer_type === 'retail'"
                    >
                      {{ customer.customer_type }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-500">
                    {{ customer.email || customer.phone || '—' }}
                  </td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <a
                      [routerLink]="['/admin/customers', customer.id, 'history']"
                      class="inline-block px-3 py-1 mr-2 text-xs font-semibold text-green-600 border border-green-200 rounded-md hover:bg-green-50 transition"
                    >
                      History
                    </a>
                    <a
                      [routerLink]="['/admin/customers', customer.id, 'edit']"
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
export class CustomerListComponent implements OnInit {
  private readonly customerService = inject(CustomerService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly customers = signal<Customer[]>([]);

  ngOnInit(): void {
    this.loadCustomers();
  }

  private loadCustomers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.customerService.getAll().subscribe({
      next: (data) => {
        this.customers.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load customers.');
        this.loading.set(false);
      },
    });
  }
}
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ProductService, HttpStatusError } from '../../../../core/services/product.service';
import { Product, PaginatedResponse } from '../../../../core/models/product';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Products</h1>
        <a
          routerLink="/admin/products/new"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + New Product
        </a>
      </div>

      <!-- SKU Search -->
      <div class="mb-6">
        <form [formGroup]="skuForm" (ngSubmit)="searchBySku()" class="flex gap-2">
          <input
            type="text"
            formControlName="sku"
            placeholder="Search by SKU…"
            class="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button
            type="submit"
            [disabled]="skuLoading()"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {{ skuLoading() ? 'Searching…' : 'Search' }}
          </button>
          @if (skuSearchActive()) {
            <button
              type="button"
              (click)="clearSkuSearch()"
              class="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition"
            >
              Clear
            </button>
          }
        </form>

        <!-- SKU search result / not-found message -->
        @if (skuNotFound()) {
          <p class="mt-2 text-sm text-red-600" role="alert">Product not found.</p>
        }
        @if (skuError()) {
          <p class="mt-2 text-sm text-red-600" role="alert">{{ skuError() }}</p>
        }
      </div>

      <!-- List error -->
      @if (listError()) {
        <div
          class="mb-4 px-4 py-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700"
          role="alert"
        >
          {{ listError() }}
        </div>
      }

      <!-- Delete error -->
      @if (deleteError()) {
        <div
          class="mb-4 px-4 py-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700"
          role="alert"
        >
          {{ deleteError() }}
        </div>
      }

      <!-- Products Table -->
      @if (loading()) {
        <div class="flex justify-center items-center py-12">
          <span class="text-gray-500 text-sm">Loading products…</span>
        </div>
      } @else {
        <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  SKU
                </th>
                <th
                  class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  Name
                </th>
                <th
                  class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  Price
                </th>
                <th
                  class="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  Category
                </th>
                <th
                  class="px-4 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              @if (displayedProducts().length === 0) {
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-gray-400">
                    No products found.
                  </td>
                </tr>
              }
              @for (product of displayedProducts(); track product.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 font-mono text-gray-700">{{ product.sku }}</td>
                  <td class="px-4 py-3 text-gray-800">{{ product.name }}</td>
                  <td class="px-4 py-3 text-gray-700">&#36;{{ (product.price ?? 0).toFixed(2) }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ product.category?.name ?? '—' }}</td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <a
                      [routerLink]="['/admin/products', product.id, 'edit']"
                      class="inline-block mr-2 px-3 py-1 text-xs font-semibold text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition"
                    >
                      Edit
                    </a>
                    <button
                      type="button"
                      (click)="confirmDelete(product)"
                      [disabled]="deletingId() === product.id"
                      class="px-3 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 transition"
                    >
                      {{ deletingId() === product.id ? 'Deleting…' : 'Delete' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination controls — hidden during SKU search -->
        @if (!skuSearchActive()) {
          <div class="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Page {{ currentPage() }} of {{ totalPages() }} ({{ total() }} total)
            </span>
            <div class="flex gap-2">
              <button
                type="button"
                (click)="prevPage()"
                [disabled]="currentPage() <= 1 || loading()"
                class="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                type="button"
                (click)="nextPage()"
                [disabled]="currentPage() >= totalPages() || loading()"
                class="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly fb = inject(FormBuilder);

  // ── List state ──────────────────────────────────────────────────────────────
  readonly loading = signal(false);
  readonly listError = signal<string | null>(null);
  readonly products = signal<Product[]>([]);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = 20;

  // ── SKU search state ─────────────────────────────────────────────────────────
  readonly skuForm = this.fb.group({ sku: [''] });
  readonly skuLoading = signal(false);
  readonly skuNotFound = signal(false);
  readonly skuError = signal<string | null>(null);
  readonly skuResult = signal<Product | null>(null);
  readonly skuSearchActive = signal(false);

  // ── Delete state ─────────────────────────────────────────────────────────────
  readonly deletingId = signal<number | null>(null);
  readonly deleteError = signal<string | null>(null);

  /** Computed total number of pages. */
  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  /** Products shown in the table — either the SKU result or the paginated list. */
  displayedProducts(): Product[] {
    if (this.skuSearchActive()) {
      const r = this.skuResult();
      return r ? [r] : [];
    }
    return this.products();
  }

  ngOnInit(): void {
    this.loadPage(1);
  }

  // ── Pagination ───────────────────────────────────────────────────────────────

  loadPage(page: number): void {
    this.loading.set(true);
    this.listError.set(null);

    this.productService.getAll(page, this.pageSize).subscribe({
      next: (response: PaginatedResponse<Product>) => {
        this.products.set(response.data);
        this.total.set(response.total);
        this.currentPage.set(response.page);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.listError.set(err.message ?? 'Failed to load products.');
        this.loading.set(false);
      },
    });
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.loadPage(this.currentPage() + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.loadPage(this.currentPage() - 1);
    }
  }

  // ── SKU Search ───────────────────────────────────────────────────────────────

  searchBySku(): void {
    const sku = (this.skuForm.get('sku')?.value ?? '').trim();
    if (!sku) {
      return;
    }

    this.skuLoading.set(true);
    this.skuNotFound.set(false);
    this.skuError.set(null);
    this.skuResult.set(null);
    this.skuSearchActive.set(false);

    this.productService
      .getBySku(sku)
      .pipe(
        catchError((err: HttpStatusError | Error) => {
          // HttpStatusError carries the original HTTP status code.
          // A 404 from the service means the SKU was not found.
          const isNotFound =
            (err instanceof HttpStatusError && err.status === 404) ||
            err.message?.toLowerCase().includes('not found');

          if (isNotFound) {
            this.skuNotFound.set(true);
          } else {
            this.skuError.set(err.message ?? 'Failed to search by SKU.');
          }

          this.skuLoading.set(false);
          this.skuSearchActive.set(true);
          return of(null);
        }),
      )
      .subscribe((product) => {
        if (product !== null) {
          this.skuResult.set(product);
          this.skuSearchActive.set(true);
        }
        this.skuLoading.set(false);
      });
  }

  clearSkuSearch(): void {
    this.skuForm.reset();
    this.skuSearchActive.set(false);
    this.skuResult.set(null);
    this.skuNotFound.set(false);
    this.skuError.set(null);
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  /**
   * Show a confirmation dialog (Req 3.4) before deleting.
   * Only dispatches DELETE when the user confirms.
   */
  confirmDelete(product: Product): void {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}" (SKU: ${product.sku})?\nThis action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    this.deleteError.set(null);
    this.deletingId.set(product.id);

    this.productService.delete(product.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        // If we were showing a SKU search result, clear it and go back to the list.
        if (this.skuSearchActive()) {
          this.clearSkuSearch();
        }
        // Reload the current page to keep pagination counts accurate.
        this.loadPage(this.currentPage());
      },
      error: (err: Error) => {
        this.deletingId.set(null);
        this.deleteError.set(err.message ?? 'Failed to delete product.');
      },
    });
  }
}

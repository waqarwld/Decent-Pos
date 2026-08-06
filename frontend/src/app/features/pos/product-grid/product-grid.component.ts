import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <div class="h-full flex flex-col bg-pos-bg">
      <!-- Grid Header -->
      <div class="px-4 py-3 flex items-center justify-between shrink-0">
        <h2 class="text-sm font-semibold text-pos-text-muted uppercase tracking-wider">Products</h2>
        @if (selectedCategoryId() !== null) {
          <button
            (click)="clearFilter()"
            class="text-xs text-pos-accent hover:text-pos-accent-hover font-medium"
          >
            Show All
          </button>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex-1 flex items-center justify-center">
          <div class="w-8 h-8 border-2 border-pos-accent/30 border-t-pos-accent rounded-full animate-spin"></div>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center px-4">
            <p class="text-pos-danger text-sm">{{ error() }}</p>
            <button
              (click)="reload()"
              class="mt-2 text-xs text-pos-accent hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      }

      <!-- Grid -->
      @if (!loading() && !error()) {
        <div class="flex-1 overflow-y-auto px-4 pb-4">
          @if (filteredProducts().length === 0) {
            <div class="flex flex-col items-center justify-center h-full text-center">
              <span class="text-4xl mb-3 opacity-30">📭</span>
              <p class="text-pos-text-muted text-sm">No products found.</p>
            </div>
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              @for (product of filteredProducts(); track product.id) {
                <app-product-card
                  [product]="product"
                  (add)="onProductAdd($event)"
                />
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ProductGridComponent {
  private readonly productService = inject(ProductService);

  @Output() productAdd = new EventEmitter<Product>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly products = signal<Product[]>([]);
  readonly selectedCategoryId = signal<number | null>(null);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getAll(1, 1000).subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load products');
        this.loading.set(false);
      },
    });
  }

  setCategoryFilter(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
  }

  clearFilter(): void {
    this.selectedCategoryId.set(null);
  }

  filteredProducts(): Product[] {
    const all = this.products();
    const catId = this.selectedCategoryId();
    if (catId === null) return all;
    return all.filter((p) => p.category_id === catId);
  }

  onProductAdd(product: Product): void {
    this.productAdd.emit(product);
  }
}

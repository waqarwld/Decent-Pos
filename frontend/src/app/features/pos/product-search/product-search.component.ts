import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product';

@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="relative w-full">
      <input
        [formControl]="searchControl"
        type="text"
        placeholder="Search by SKU or product name..."
        class="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        autocomplete="off"
        (focus)="showDropdown = results.length > 0"
        (blur)="onBlur()"
      />

      <!-- Loading indicator -->
      <div
        *ngIf="loading"
        class="absolute right-3 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"
      ></div>

      <!-- Results dropdown -->
      <ul
        *ngIf="showDropdown && results.length > 0"
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
      >
        <li
          *ngFor="let product of results"
          (mousedown)="selectProduct(product)"
          class="flex cursor-pointer items-center justify-between px-4 py-2 text-sm hover:bg-indigo-50"
        >
          <div>
            <span class="font-medium text-gray-900">{{ product.name }}</span>
            <span class="ml-2 text-xs text-gray-500">{{ product.sku }}</span>
          </div>
          <span class="text-gray-700">\${{ (product.price ?? 0).toFixed(2) }}</span>
        </li>
      </ul>

      <!-- No results -->
      <div
        *ngIf="showDropdown && !loading && results.length === 0 && searchControl.value && searchControl.value.length > 0"
        class="absolute z-10 mt-1 w-full rounded-md bg-white px-4 py-3 text-sm text-gray-500 shadow-lg ring-1 ring-black ring-opacity-5"
      >
        No products found.
      </div>

      <!-- Error message -->
      <div
        *ngIf="error"
        class="mt-1 text-xs text-red-600"
      >
        {{ error }}
      </div>
    </div>
  `,
})
export class ProductSearchComponent implements OnInit, OnDestroy {
  @Output() productSelected = new EventEmitter<Product>();

  searchControl = new FormControl('');
  results: Product[] = [];
  loading = false;
  showDropdown = false;
  error: string | null = null;

  private readonly productService = inject(ProductService);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap((query) => {
          const trimmed = (query ?? '').trim();
          if (!trimmed) {
            this.results = [];
            this.showDropdown = false;
            this.loading = false;
            return [];
          }
          this.loading = true;
          this.error = null;
          return this.productService.search(trimmed);
        })
      )
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.results = response.data ?? [];
          this.showDropdown = this.results.length > 0;
        },
        error: (err: Error) => {
          this.loading = false;
          this.results = [];
          this.showDropdown = false;
          this.error = err.message ?? 'Failed to search products.';
        },
      });
  }

  selectProduct(product: Product): void {
    this.productSelected.emit(product);
    this.searchControl.setValue('', { emitEvent: false });
    this.results = [];
    this.showDropdown = false;
  }

  onBlur(): void {
    // Delay hiding so mousedown on a list item fires first
    setTimeout(() => {
      this.showDropdown = false;
    }, 150);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

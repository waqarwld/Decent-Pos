import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/product';

@Component({
  selector: 'app-category-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full bg-pos-surface border-r border-pos-surface-light flex flex-col">
      <!-- Header -->
      <div class="px-3 py-3 border-b border-pos-surface-light">
        <h2 class="text-xs font-semibold text-pos-text-muted uppercase tracking-wider">Categories</h2>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex-1 flex items-center justify-center">
          <span class="text-pos-text-muted text-sm">Loading…</span>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="px-3 py-4 text-xs text-pos-danger text-center">{{ error() }}</div>
      }

      <!-- Category List -->
      @if (!loading() && !error()) {
        <div class="flex-1 overflow-y-auto py-2">
          <button
            type="button"
            (click)="selectCategory(null)"
            class="w-full text-left px-3 py-3 text-sm font-medium transition flex items-center gap-2"
            [class.bg-pos-accent/15]="selectedCategoryId() === null"
            [class.text-pos-accent]="selectedCategoryId() === null"
            [class.text-pos-text]="selectedCategoryId() !== null"
            [class.hover:bg-pos-surface-light]="selectedCategoryId() !== null"
          >
            <span class="text-base">📋</span>
            All Products
          </button>

          @for (cat of categories(); track cat.id) {
            <button
              type="button"
              (click)="selectCategory(cat.id)"
              class="w-full text-left px-3 py-3 text-sm font-medium transition flex items-center gap-2"
              [class.bg-pos-accent/15]="selectedCategoryId() === cat.id"
              [class.text-pos-accent]="selectedCategoryId() === cat.id"
              [class.text-pos-text]="selectedCategoryId() !== cat.id"
              [class.hover:bg-pos-surface-light]="selectedCategoryId() !== cat.id"
            >
              <span class="text-base">📁</span>
              {{ cat.name }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class CategorySidebarComponent {
  private readonly categoryService = inject(CategoryService);

  @Output() categorySelected = new EventEmitter<number | null>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly selectedCategoryId = signal<number | null>(null);

  constructor() {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load categories');
        this.loading.set(false);
      },
    });
  }

  selectCategory(id: number | null): void {
    this.selectedCategoryId.set(id);
    this.categorySelected.emit(id);
  }
}

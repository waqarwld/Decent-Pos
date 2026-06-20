import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/product';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <a
          routerLink="/admin/products"
          class="text-gray-500 hover:text-gray-700 transition"
          aria-label="Back to products"
        >
          ← Back
        </a>
        <h1 class="text-2xl font-bold text-gray-800">
          {{ isEditMode() ? 'Edit Product' : 'New Product' }}
        </h1>
      </div>

      <!-- Loading skeleton for edit mode -->
      @if (loadingProduct()) {
        <div class="flex justify-center items-center py-12">
          <span class="text-gray-500 text-sm">Loading product…</span>
        </div>
      } @else {
        <!-- Load error (edit mode only) -->
        @if (loadError()) {
          <div
            class="mb-4 px-4 py-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700"
            role="alert"
          >
            {{ loadError() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="space-y-5">

          <!-- SKU -->
          <div>
            <label for="sku" class="block text-sm font-medium text-gray-700 mb-1">
              SKU <span class="text-red-500">*</span>
            </label>
            <input
              id="sku"
              type="text"
              formControlName="sku"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              [class.border-red-400]="isInvalid('sku')"
              [class.border-gray-300]="!isInvalid('sku')"
              placeholder="e.g. PROD-001"
            />
            @if (isInvalid('sku')) {
              <p class="mt-1 text-xs text-red-600" role="alert">SKU is required.</p>
            }
          </div>

          <!-- Unit of Measure -->
          <div>
            <label for="unit_of_measure" class="block text-sm font-medium text-gray-700 mb-1">
              Unit of Measure <span class="text-red-500">*</span>
            </label>
            <select
              id="unit_of_measure"
              formControlName="unit_of_measure"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
            >
              <option value="each">Each</option>
              <option value="kg">Kilogram</option>
              <option value="litre">Litre</option>
              <option value="pack">Pack</option>
            </select>
          </div>

          <!-- Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              formControlName="name"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              [class.border-red-400]="isInvalid('name')"
              [class.border-gray-300]="!isInvalid('name')"
              placeholder="Product name"
            />
            @if (isInvalid('name')) {
              <p class="mt-1 text-xs text-red-600" role="alert">Name is required.</p>
            }
          </div>

          <!-- Price -->
          <div>
            <label for="price" class="block text-sm font-medium text-gray-700 mb-1">
              Price <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">$</span>
              <input
                id="price"
                type="number"
                formControlName="price"
                min="0"
                step="0.01"
                class="w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                [class.border-red-400]="isInvalid('price')"
                [class.border-gray-300]="!isInvalid('price')"
                placeholder="0.00"
              />
            </div>
            @if (isInvalid('price')) {
              <p class="mt-1 text-xs text-red-600" role="alert">
                @if (form.get('price')?.errors?.['required']) {
                  Price is required.
                } @else if (form.get('price')?.errors?.['min']) {
                  Price must be 0 or greater.
                }
              </p>
            }
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              formControlName="description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              placeholder="Optional product description"
            ></textarea>
          </div>

          <!-- Category -->
          <div>
            <label for="category_id" class="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            @if (categoriesLoading()) {
              <p class="text-xs text-gray-400">Loading categories…</p>
            } @else {
              <select
                id="category_id"
                formControlName="category_id"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
              >
                <option [ngValue]="null">— No category —</option>
                @for (cat of categories(); track cat.id) {
                  <option [ngValue]="cat.id">{{ cat.name }}</option>
                }
              </select>
            }
          </div>

          <!-- Submit error -->
          @if (submitError()) {
            <div
              class="px-4 py-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700"
              role="alert"
            >
              {{ submitError() }}
            </div>
          }

          <!-- Submit success -->
          @if (submitSuccess()) {
            <div
              class="px-4 py-3 bg-green-50 border border-green-300 rounded-lg text-sm text-green-700"
              role="status"
            >
              Product {{ isEditMode() ? 'updated' : 'created' }} successfully. Redirecting…
            </div>
          }

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-2">
            <button
              type="submit"
              [disabled]="form.invalid || submitting()"
              class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {{ submitting() ? (isEditMode() ? 'Saving…' : 'Creating…') : (isEditMode() ? 'Save Changes' : 'Create Product') }}
            </button>
            <a
              routerLink="/admin/products"
              class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </a>
          </div>

        </form>
      }
    </div>
  `,
})
export class ProductFormComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // ── Mode detection ───────────────────────────────────────────────────────────
  readonly isEditMode = signal(false);
  private productId: number | null = null;

  // ── Form ─────────────────────────────────────────────────────────────────────
  readonly form = this.fb.group({
    sku: ['', [Validators.required]],
    name: ['', [Validators.required]],
    unit_of_measure: ['each', [Validators.required]],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    description: [''],
    category_id: [null as number | null],
  });

  // ── State ────────────────────────────────────────────────────────────────────
  readonly loadingProduct = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitSuccess = signal(false);
  readonly categories = signal<Category[]>([]);
  readonly categoriesLoading = signal(false);

  ngOnInit(): void {
    this.loadCategories();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        this.isEditMode.set(true);
        this.productId = id;
        this.loadProduct(id);
      }
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  /** Returns true when a control has been touched/dirty and is invalid. */
  isInvalid(controlName: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  // ── Data loading ──────────────────────────────────────────────────────────────

  private loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoryService.getAll().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.categoriesLoading.set(false);
      },
      error: () => {
        // Non-fatal — category dropdown will just be empty
        this.categoriesLoading.set(false);
      },
    });
  }

  private loadProduct(id: number): void {
    this.loadingProduct.set(true);
    this.loadError.set(null);

    this.productService.getById(id).subscribe({
      next: (product) => {
        this.form.patchValue({
          sku: product.sku,
          name: product.name,
          unit_of_measure: product.unit_of_measure ?? 'each',
          price: product.price ?? null,
          description: product.description ?? '',
          category_id: product.category_id ?? null,
        });
        this.loadingProduct.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err.message ?? 'Failed to load product.');
        this.loadingProduct.set(false);
      },
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    const raw = this.form.getRawValue();
    const payload = {
      sku: raw.sku!.trim(),
      name: raw.name!.trim(),
      unit_of_measure: raw.unit_of_measure!.trim(),
      selling_price: raw.price!,
      description: raw.description?.trim() || undefined,
      category_id: raw.category_id ?? undefined,
    };

    const request$ = this.isEditMode() && this.productId !== null
      ? this.productService.update(this.productId, payload)
      : this.productService.create(payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set(true);
        // Navigate back to product list after a brief moment
        setTimeout(() => this.router.navigate(['/admin/products']), 800);
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.submitError.set(err.message ?? 'An unexpected error occurred. Please try again.');
      },
    });
  }
}

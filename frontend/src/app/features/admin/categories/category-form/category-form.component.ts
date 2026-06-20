import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <a
          routerLink="/admin/categories"
          class="text-gray-500 hover:text-gray-700 transition"
          aria-label="Back to categories"
        >
          ← Back
        </a>
        <h1 class="text-2xl font-bold text-gray-800">
          {{ isEditMode() ? 'Edit Category' : 'New Category' }}
        </h1>
      </div>

      <!-- Loading skeleton for edit mode -->
      @if (loadingCategory()) {
        <div class="flex justify-center items-center py-12">
          <span class="text-gray-500 text-sm">Loading category…</span>
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
              placeholder="Category name"
            />
            @if (isInvalid('name')) {
              <p class="mt-1 text-xs text-red-600" role="alert">Name is required.</p>
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
              placeholder="Optional category description"
            ></textarea>
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
              Category {{ isEditMode() ? 'updated' : 'created' }} successfully. Redirecting…
            </div>
          }

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-2">
            <button
              type="submit"
              [disabled]="form.invalid || submitting()"
              class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {{ submitting() ? (isEditMode() ? 'Saving…' : 'Creating…') : (isEditMode() ? 'Save Changes' : 'Create Category') }}
            </button>
            <a
              routerLink="/admin/categories"
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
export class CategoryFormComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // ── Mode detection ───────────────────────────────────────────────────────────
  readonly isEditMode = signal(false);
  private categoryId: number | null = null;

  // ── Form ─────────────────────────────────────────────────────────────────────
  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
  });

  // ── State ────────────────────────────────────────────────────────────────────
  readonly loadingCategory = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitSuccess = signal(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        this.isEditMode.set(true);
        this.categoryId = id;
        this.loadCategory(id);
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

  private loadCategory(id: number): void {
    this.loadingCategory.set(true);
    this.loadError.set(null);

    // CategoryService.getAll() returns all categories; we find the one we need.
    // The API does not expose a GET /api/v1/categories/{id} endpoint, so we
    // retrieve the full list and filter client-side.
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        const category = categories.find(c => c.id === id);
        if (category) {
          this.form.patchValue({
            name: category.name,
            description: category.description ?? '',
          });
        } else {
          this.loadError.set('Category not found.');
        }
        this.loadingCategory.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err.message ?? 'Failed to load category.');
        this.loadingCategory.set(false);
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
      name: raw.name!.trim(),
      description: raw.description?.trim() || undefined,
    };

    const request$ = this.isEditMode() && this.categoryId !== null
      ? this.categoryService.update(this.categoryId, payload)
      : this.categoryService.create(payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set(true);
        // Navigate back to category list after a brief moment
        setTimeout(() => this.router.navigate(['/admin/categories']), 800);
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.submitError.set(err.message ?? 'An unexpected error occurred. Please try again.');
      },
    });
  }
}

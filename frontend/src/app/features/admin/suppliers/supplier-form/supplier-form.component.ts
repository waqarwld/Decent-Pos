import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupplierService } from '../../../../core/services/supplier.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <a
          routerLink="/admin/suppliers"
          class="text-gray-500 hover:text-gray-700 transition"
          aria-label="Back to suppliers"
        >
          ← Back
        </a>
        <h1 class="text-2xl font-bold text-gray-800">
          {{ isEditMode() ? 'Edit Supplier' : 'New Supplier' }}
        </h1>
      </div>

      <!-- Loading skeleton for edit mode -->
      @if (loadingSupplier()) {
        <div class="flex justify-center items-center py-12">
          <span class="text-gray-500 text-sm">Loading supplier…</span>
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

          <!-- Code -->
          <div>
            <label for="code" class="block text-sm font-medium text-gray-700 mb-1">
              Code <span class="text-red-500">*</span>
            </label>
            <input
              id="code"
              type="text"
              formControlName="code"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              [class.border-red-400]="isInvalid('code')"
              [class.border-gray-300]="!isInvalid('code')"
              placeholder="Supplier code"
            />
            @if (isInvalid('code')) {
              <p class="mt-1 text-xs text-red-600" role="alert">Code is required.</p>
            }
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
              placeholder="Supplier name"
            />
            @if (isInvalid('name')) {
              <p class="mt-1 text-xs text-red-600" role="alert">Name is required.</p>
            }
          </div>

          <!-- Contact Info -->
          <div>
            <label for="contact_info" class="block text-sm font-medium text-gray-700 mb-1">
              Contact Info
            </label>
            <textarea
              id="contact_info"
              formControlName="contact_info"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              placeholder="Optional contact details (phone, email, address…)"
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
              Supplier {{ isEditMode() ? 'updated' : 'created' }} successfully. Redirecting…
            </div>
          }

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-2">
            <button
              type="submit"
              [disabled]="form.invalid || submitting()"
              class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {{ submitting() ? (isEditMode() ? 'Saving…' : 'Creating…') : (isEditMode() ? 'Save Changes' : 'Create Supplier') }}
            </button>
            <a
              routerLink="/admin/suppliers"
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
export class SupplierFormComponent implements OnInit {
  private readonly supplierService = inject(SupplierService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // ── Mode detection ───────────────────────────────────────────────────────────
  readonly isEditMode = signal(false);
  private supplierId: number | null = null;

  // ── Form ─────────────────────────────────────────────────────────────────────
  readonly form = this.fb.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    contact_info: [''],
  });

  // ── State ────────────────────────────────────────────────────────────────────
  readonly loadingSupplier = signal(false);
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
        this.supplierId = id;
        this.loadSupplier(id);
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

  private loadSupplier(id: number): void {
    // SupplierService doesn't have a getById, so we fetch all and find by id.
    this.loadingSupplier.set(true);
    this.loadError.set(null);

    this.supplierService.getAll().subscribe({
      next: (suppliers) => {
        const supplier = suppliers.find(s => s.id === id);
        if (supplier) {
          this.form.patchValue({
            code: (supplier as any).code || '',
            name: supplier.name,
            contact_info: supplier.contact_info ?? '',
          });
        } else {
          this.loadError.set('Supplier not found.');
        }
        this.loadingSupplier.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err.message ?? 'Failed to load supplier.');
        this.loadingSupplier.set(false);
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
      code: raw.code!.trim(),
      name: raw.name!.trim(),
      contact_info: raw.contact_info?.trim() || undefined,
    };

    const request$ = this.isEditMode() && this.supplierId !== null
      ? this.supplierService.update(this.supplierId, payload)
      : this.supplierService.create(payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set(true);
        // Navigate back to supplier list after a brief moment
        setTimeout(() => this.router.navigate(['/admin/suppliers']), 800);
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.submitError.set(err.message ?? 'An unexpected error occurred. Please try again.');
      },
    });
  }
}

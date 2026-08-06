import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InventoryService } from '../../../../core/services/inventory.service';
import { ProductService } from '../../../../core/services/product.service';
import { LocationService } from '../../../../core/services/location.service';
import { Product } from '../../../../core/models/product';

@Component({
  selector: 'app-ship-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <a
          routerLink="/admin/inventory"
          class="text-gray-500 hover:text-gray-700 transition"
          aria-label="Back to inventory"
        >
          ← Back
        </a>
        <h1 class="text-2xl font-bold text-gray-800">Ship Inventory</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="space-y-5">

        <!-- Product -->
        <div>
          <label for="product_id" class="block text-sm font-medium text-gray-700 mb-1">
            Product <span class="text-red-500">*</span>
          </label>
          @if (loadingProducts()) {
            <p class="text-sm text-gray-500 py-2">Loading products…</p>
          } @else {
            <select
              id="product_id"
              formControlName="product_id"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              [class.border-red-400]="isInvalid('product_id')"
              [class.border-gray-300]="!isInvalid('product_id')"
            >
              <option value="">Select product</option>
              @for (product of products(); track product.id) {
                <option [value]="product.id">{{ product.name }} ({{ product.sku }})</option>
              }
            </select>
          }
          @if (isInvalid('product_id')) {
            <p class="mt-1 text-xs text-red-600" role="alert">Product is required.</p>
          }
        </div>

        <!-- Location -->
        <div>
          <label for="location_id" class="block text-sm font-medium text-gray-700 mb-1">
            Location <span class="text-red-500">*</span>
          </label>
          @if (loadingLocations()) {
            <p class="text-sm text-gray-500 py-2">Loading locations…</p>
          } @else {
            <select
              id="location_id"
              formControlName="location_id"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              [class.border-red-400]="isInvalid('location_id')"
              [class.border-gray-300]="!isInvalid('location_id')"
            >
              <option value="">Select location</option>
              @for (location of locations(); track location.id) {
                <option [value]="location.id">{{ location.name }}</option>
              }
            </select>
          }
          @if (isInvalid('location_id')) {
            <p class="mt-1 text-xs text-red-600" role="alert">Location is required.</p>
          }
        </div>

        <!-- Quantity -->
        <div>
          <label for="quantity" class="block text-sm font-medium text-gray-700 mb-1">
            Quantity <span class="text-red-500">*</span>
          </label>
          <input
            id="quantity"
            type="number"
            formControlName="quantity"
            min="1"
            class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            [class.border-red-400]="isInvalid('quantity')"
            [class.border-gray-300]="!isInvalid('quantity')"
            placeholder="Quantity"
          />
          @if (isInvalid('quantity')) {
            <p class="mt-1 text-xs text-red-600" role="alert">Quantity must be at least 1.</p>
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
            Inventory shipped successfully. Redirecting…
          </div>
        }

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-2">
          <button
            type="submit"
            [disabled]="form.invalid || submitting()"
            class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {{ submitting() ? 'Shipping…' : 'Ship' }}
          </button>
          <a
            routerLink="/admin/inventory"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </a>
        </div>

      </form>
    </div>
  `,
})
export class ShipFormComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly productService = inject(ProductService);
  private readonly locationService = inject(LocationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // ── Form ─────────────────────────────────────────────────────────────────────
  readonly form = this.fb.group({
    product_id: ['', [Validators.required]],
    location_id: ['', [Validators.required]],
    quantity: [null, [Validators.required, Validators.min(1)]],
  });

  // ── State ────────────────────────────────────────────────────────────────────
  readonly loadingProducts = signal(false);
  readonly loadingLocations = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitSuccess = signal(false);

  readonly products = signal<Product[]>([]);
  readonly locations = signal<{ id: number; name: string }[]>([]);

  ngOnInit(): void {
    this.loadProducts();
    this.loadLocations();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  isInvalid(controlName: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  // ── Data loading ──────────────────────────────────────────────────────────────

  private loadProducts(): void {
    this.loadingProducts.set(true);
    this.productService.getAll().subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.loadingProducts.set(false);
      },
    });
  }

  private loadLocations(): void {
    this.loadingLocations.set(true);
    this.locationService.getAll().subscribe({
      next: (data) => {
        this.locations.set(data);
        this.loadingLocations.set(false);
      },
      error: () => {
        this.loadingLocations.set(false);
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

    this.inventoryService.ship({
      product_id: Number(raw.product_id),
      location_id: Number(raw.location_id),
      quantity: Number(raw.quantity),
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set(true);
        setTimeout(() => this.router.navigate(['/admin/inventory']), 800);
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.submitError.set(err.message ?? 'An unexpected error occurred. Please try again.');
      },
    });
  }
}
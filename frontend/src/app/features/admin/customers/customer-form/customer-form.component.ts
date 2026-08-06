import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../../../core/services/customer.service';
import { CustomerType } from '../../../../core/models/customer';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/admin/customers" class="text-gray-500 hover:text-gray-700 transition" aria-label="Back to customers">
          ← Back
        </a>
        <h1 class="text-2xl font-bold text-gray-800">
          {{ isEditMode() ? 'Edit Customer' : 'New Customer' }}
        </h1>
      </div>

      <!-- Loading skeleton for edit mode -->
      @if (loadingCustomer()) {
        <div class="flex justify-center items-center py-12">
          <span class="text-gray-500 text-sm">Loading customer…</span>
        </div>
      } @else {
        @if (loadError()) {
          <div class="mb-4 px-4 py-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700" role="alert">
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
              placeholder="Customer name"
            />
            @if (isInvalid('name')) {
              <p class="mt-1 text-xs text-red-600" role="alert">Name is required.</p>
            }
          </div>

          <!-- Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="setType('retail')"
                class="py-3 rounded-xl text-sm font-semibold transition border"
                [class.bg-green-600]="form.get('customer_type')?.value === 'retail'"
                [class.text-white]="form.get('customer_type')?.value === 'retail'"
                [class.border-green-600]="form.get('customer_type')?.value === 'retail'"
                [class.bg-white]="form.get('customer_type')?.value !== 'retail'"
                [class.text-gray-700]="form.get('customer_type')?.value !== 'retail'"
                [class.border-gray-300]="form.get('customer_type')?.value !== 'retail'"
              >
                🛒 Retail
              </button>
              <button
                type="button"
                (click)="setType('wholesale')"
                class="rounded-lg py-3 text-sm font-semibold transition border"
                [class.bg-purple-600]="formType() === 'wholesale'"
                [class.text-white]="formType() === 'wholesale'"
                [class.border-purple-600]="formType() === 'wholesale'"
                [class.bg-white]="formType() !== 'wholesale'"
                [class.text-gray-700]="formType() !== 'wholesale'"
                [class.border-gray-300]="formType() !== 'wholesale'"
              >
                🏭 Wholesale
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-400">
              {{ formType() === 'wholesale' ? 'Wholesale customers are charged the wholesale price.' : 'Retail (default) — charged standard selling price.' }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="customer@example.com"
            />
            @if (isInvalid('email')) {
              <p class="mt-1 text-xs text-red-600" role="alert">Enter a valid email address.</p>
            }
          </div>

          <!-- Phone -->
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              id="phone"
              type="text"
              formControlName="phone"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Phone number"
            />
          </div>

          <!-- Address -->
          <div>
            <label for="address" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              id="address"
              formControlName="address"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              placeholder="Optional address"
            ></textarea>
          </div>

          <!-- Submit error -->
          @if (submitError()) {
            <div class="px-4 py-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700" role="alert">
              {{ submitError() }}
            </div>
          }

          <!-- Submit success -->
          @if (submitSuccess()) {
            <div class="px-4 py-3 bg-green-50 border border-green-300 rounded-lg text-sm text-green-700" role="status">
              Customer {{ isEditMode() ? 'updated' : 'created' }} successfully. Redirecting…
            </div>
          }

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-2">
            <button
              type="submit"
              [disabled]="form.invalid || submitting()"
              class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {{ submitting() ? (isEditMode() ? 'Saving…' : 'Creating…') : (isEditMode() ? 'Save Changes' : 'Create Customer') }}
            </button>
            <a
              routerLink="/admin/customers"
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
export class CustomerFormComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // ── Mode detection ───────────────────────────────────────────────────────────
  readonly isEditMode = signal(false);
  private customerId: number | null = null;

  // ── Form ─────────────────────────────────────────────────────────────────────
  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    customer_type: ['retail' as CustomerType],
    email: ['', [Validators.email]],
    phone: [''],
    address: [''],
  });

  // ── State ────────────────────────────────────────────────────────────────────
  readonly loadingCustomer = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitSuccess = signal(false);

  readonly formType = signal<CustomerType>('retail');

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        this.isEditMode.set(true);
        this.customerId = id;
        this.loadCustomer(id);
      }
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  isInvalid(controlName: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  setType(type: CustomerType): void {
    this.formType.set(type);
    this.form.patchValue({ customer_type: type });
  }

  // ── Data loading ──────────────────────────────────────────────────────────────

  private loadCustomer(id: number): void {
    this.loadingCustomer.set(true);
    this.loadError.set(null);

    this.customerService.getById(id).subscribe({
      next: (customer) => {
        this.form.setValue({
          name: customer.name,
          customer_type: customer.customer_type,
          email: customer.email ?? '',
          phone: customer.phone ?? '',
          address: customer.address ?? '',
        });
        this.formType.set(customer.customer_type);
        this.loadingCustomer.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err.message ?? 'Failed to load customer.');
        this.loadingCustomer.set(false);
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
      customer_type: raw.customer_type as CustomerType,
      email: raw.email?.trim() || undefined,
      phone: raw.phone?.trim() || undefined,
      address: raw.address?.trim() || undefined,
    };

    const request$ = this.isEditMode() && this.customerId !== null
      ? this.customerService.update(this.customerId, payload)
      : this.customerService.create(payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set(true);
        setTimeout(() => this.router.navigate(['/admin/customers']), 800);
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.submitError.set(err.message ?? 'An unexpected error occurred. Please try again.');
      },
    });
  }
}
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LocationService } from '../../../../core/services/location.service';

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <a
          routerLink="/admin/locations"
          class="text-gray-500 hover:text-gray-700 transition"
          aria-label="Back to locations"
        >
          ← Back
        </a>
        <h1 class="text-2xl font-bold text-gray-800">
          {{ isEditMode() ? 'Edit Location' : 'New Location' }}
        </h1>
      </div>

      <!-- Loading skeleton for edit mode -->
      @if (loadingLocation()) {
        <div class="flex justify-center items-center py-12">
          <span class="text-gray-500 text-sm">Loading location…</span>
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
              placeholder="e.g. WH-001"
            />
            @if (isInvalid('code')) {
              <p class="mt-1 text-xs text-red-600" role="alert">Code is required.</p>
            }
          </div>

          <!-- Location Type -->
          <div>
            <label for="location_type" class="block text-sm font-medium text-gray-700 mb-1">
              Type <span class="text-red-500">*</span>
            </label>
            <select
              id="location_type"
              formControlName="location_type"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
            >
              <option value="warehouse">Warehouse</option>
              <option value="store">Store</option>
              <option value="bin">Bin</option>
              <option value="zone">Zone</option>
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
              placeholder="Location name"
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
              placeholder="Optional location description"
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
              Location {{ isEditMode() ? 'updated' : 'created' }} successfully. Redirecting…
            </div>
          }

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-2">
            <button
              type="submit"
              [disabled]="form.invalid || submitting()"
              class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {{ submitting() ? (isEditMode() ? 'Saving…' : 'Creating…') : (isEditMode() ? 'Save Changes' : 'Create Location') }}
            </button>
            <a
              routerLink="/admin/locations"
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
export class LocationFormComponent implements OnInit {
  private readonly locationService = inject(LocationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // ── Mode detection ───────────────────────────────────────────────────────────
  readonly isEditMode = signal(false);
  private locationId: number | null = null;

  // ── Form ─────────────────────────────────────────────────────────────────────
  readonly form = this.fb.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    location_type: ['warehouse', [Validators.required]],
    description: [''],
  });

  // ── State ────────────────────────────────────────────────────────────────────
  readonly loadingLocation = signal(false);
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
        this.locationId = id;
        this.loadLocation(id);
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

  private loadLocation(id: number): void {
    this.loadingLocation.set(true);
    this.loadError.set(null);

    // Load from the full list and find by ID (LocationService has no getById)
    this.locationService.getAll().subscribe({
      next: (locations) => {
        const location = locations.find(l => l.id === id);
        if (location) {
          this.form.patchValue({
            name: location.name,
            description: location.description ?? '',
          });
        } else {
          this.loadError.set('Location not found.');
        }
        this.loadingLocation.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err.message ?? 'Failed to load location.');
        this.loadingLocation.set(false);
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
      location_type: raw.location_type!.trim(),
      description: raw.description?.trim() || undefined,
    };

    const request$ = this.isEditMode() && this.locationId !== null
      ? this.locationService.update(this.locationId, payload)
      : this.locationService.create(payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set(true);
        // Navigate back to location list after a brief moment
        setTimeout(() => this.router.navigate(['/admin/locations']), 800);
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.submitError.set(err.message ?? 'An unexpected error occurred. Please try again.');
      },
    });
  }
}

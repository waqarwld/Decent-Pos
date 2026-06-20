import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 class="text-2xl font-bold text-gray-800 mb-6 text-center">Sign In</h1>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>

          <!-- Username -->
          <div class="mb-4">
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              formControlName="username"
              autocomplete="username"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              [ngClass]="{
                'border-red-400': usernameInvalid,
                'border-gray-300': !usernameInvalid
              }"
            />
            @if (usernameInvalid) {
              <p class="mt-1 text-xs text-red-500">Username is required.</p>
            }
          </div>

          <!-- Password -->
          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              [ngClass]="{
                'border-red-400': passwordInvalid,
                'border-gray-300': !passwordInvalid
              }"
            />
            @if (passwordInvalid) {
              <p class="mt-1 text-xs text-red-500">Password is required.</p>
            }
          </div>

          <!-- Error message -->
          @if (errorMessage()) {
            <div class="mb-4 px-3 py-2 bg-red-50 border border-red-300 rounded-lg text-sm text-red-600" role="alert">
              {{ errorMessage() }}
            </div>
          }

          <!-- Submit -->
          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            @if (loading()) {
              <span>Signing in…</span>
            } @else {
              <span>Sign In</span>
            }
          </button>

        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  get usernameInvalid(): boolean {
    const ctrl = this.loginForm.get('username')!;
    return ctrl.invalid && ctrl.touched;
  }

  get passwordInvalid(): boolean {
    const ctrl = this.loginForm.get('password')!;
    return ctrl.invalid && ctrl.touched;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.loginForm.getRawValue();

    this.authService.login({ username: username!, password: password! }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/pos']);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Invalid username or password.');
      },
    });
  }
}

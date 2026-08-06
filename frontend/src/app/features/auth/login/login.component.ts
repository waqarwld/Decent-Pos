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
    <div class="min-h-screen flex items-center justify-center bg-pos-bg relative overflow-hidden">
      <!-- Subtle radial glow behind card -->
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,212,255,0.08)_0%,_transparent_70%)] pointer-events-none"></div>

      <div class="relative z-10 bg-pos-surface border border-pos-surface-light rounded-2xl shadow-2xl p-10 w-full max-w-md mx-4">
        <!-- Logo / Title -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-xl bg-pos-accent/10 flex items-center justify-center">
            <span class="text-3xl">📦</span>
          </div>
          <h1 class="text-3xl font-bold text-pos-text tracking-tight">Inventory POS</h1>
          <p class="text-pos-text-muted text-sm mt-2">Sign in to continue</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate class="space-y-5">

          <!-- Username -->
          <div>
            <label for="username" class="block text-sm font-medium text-pos-text-muted mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              formControlName="username"
              autocomplete="username"
              placeholder="Enter username"
              class="w-full px-4 py-3.5 bg-pos-surface-light border border-pos-surface-light rounded-xl text-pos-text text-base placeholder-pos-text-muted/50 focus:outline-none focus:ring-2 focus:ring-pos-accent focus:border-pos-accent transition"
              [ngClass]="{
                'border-pos-danger': usernameInvalid,
                'border-pos-surface-light': !usernameInvalid
              }"
            />
            @if (usernameInvalid) {
              <p class="mt-2 text-sm text-pos-danger">Username is required.</p>
            }
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-pos-text-muted mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              placeholder="Enter password"
              class="w-full px-4 py-3.5 bg-pos-surface-light border border-pos-surface-light rounded-xl text-pos-text text-base placeholder-pos-text-muted/50 focus:outline-none focus:ring-2 focus:ring-pos-accent focus:border-pos-accent transition"
              [ngClass]="{
                'border-pos-danger': passwordInvalid,
                'border-pos-surface-light': !passwordInvalid
              }"
            />
            @if (passwordInvalid) {
              <p class="mt-2 text-sm text-pos-danger">Password is required.</p>
            }
          </div>

          <!-- Error message -->
          @if (errorMessage()) {
            <div class="px-4 py-3 bg-pos-danger/10 border border-pos-danger/30 rounded-xl text-sm text-pos-danger text-center" role="alert">
              {{ errorMessage() }}
            </div>
          }

          <!-- Submit -->
          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-4 px-6 bg-pos-accent hover:bg-pos-accent-hover disabled:bg-pos-accent/40 text-pos-bg font-bold rounded-xl text-base transition focus:outline-none focus:ring-2 focus:ring-pos-accent focus:ring-offset-2 focus:ring-offset-pos-surface"
          >
            @if (loading()) {
              <span class="flex items-center justify-center gap-2">
                <span class="w-5 h-5 border-2 border-pos-bg/30 border-t-pos-bg rounded-full animate-spin"></span>
                Signing in…
              </span>
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

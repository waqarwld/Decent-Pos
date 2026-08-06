import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiHealthService } from '../../../core/services/api-health.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (authService.isAuthenticated()) {
      <!-- Connectivity warning banner -->
      @if (!apiHealthService.isConnected()) {
        <div class="bg-pos-warning/10 text-pos-warning text-sm font-medium px-4 py-2 text-center border-b border-pos-warning/20" role="alert">
          ⚠ Unable to reach the server. Please check your connection.
        </div>
      }

      <!-- Navigation bar -->
      <nav class="bg-admin-sidebar text-white px-4 py-2.5 flex items-center justify-between h-14">
        <div class="flex items-center gap-6">
          <!-- Logo -->
          <a routerLink="/pos" class="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90 transition">
            <span class="text-xl">📦</span>
            <span class="hidden md:block">Inventory POS</span>
          </a>

          <!-- Nav Links -->
          <div class="hidden sm:flex items-center gap-1">
            <a
              routerLink="/pos"
              routerLinkActive="bg-white/10 text-white"
              class="text-white/70 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              POS
            </a>
            <a
              routerLink="/admin"
              routerLinkActive="bg-white/10 text-white"
              class="text-white/70 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              Admin
            </a>
          </div>
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-3">
          <span class="text-xs text-white/50 hidden lg:block">
            {{ authService.getToken() ? 'Logged in' : 'Session expired' }}
          </span>
          <button
            (click)="authService.logout()"
            class="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg font-medium transition"
          >
            Logout
          </button>
        </div>
      </nav>
    }
  `,
})
export class TopNavComponent {
  protected readonly authService = inject(AuthService);
  protected readonly apiHealthService = inject(ApiHealthService);
}

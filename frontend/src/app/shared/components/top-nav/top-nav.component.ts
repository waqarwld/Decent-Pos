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
        <div class="bg-yellow-400 text-yellow-900 text-sm font-medium px-4 py-2 text-center" role="alert">
          ⚠ Unable to reach the server. Please check your connection.
        </div>
      }

      <!-- Navigation bar -->
      <nav class="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <span class="font-bold text-lg tracking-tight">POS System</span>
          <a
            routerLink="/pos"
            routerLinkActive="text-white font-semibold underline"
            [routerLinkActiveOptions]="{ exact: true }"
            class="text-gray-300 hover:text-white transition-colors"
          >
            POS
          </a>
          <a
            routerLink="/admin"
            routerLinkActive="text-white font-semibold underline"
            class="text-gray-300 hover:text-white transition-colors"
          >
            Admin
          </a>
        </div>
        <button
          (click)="authService.logout()"
          class="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded transition-colors"
        >
          Logout
        </button>
      </nav>
    }
  `,
})
export class TopNavComponent {
  protected readonly authService = inject(AuthService);
  protected readonly apiHealthService = inject(ApiHealthService);
}

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="h-full w-56 bg-admin-sidebar flex flex-col py-3">
      <div class="px-4 pb-3 mb-2 border-b border-white/10">
        <p class="text-xs font-semibold text-white/40 uppercase tracking-wider">Management</p>
      </div>

      <div class="flex-1 overflow-y-auto space-y-0.5 px-2">
        <a
          routerLink="/admin/dashboard"
          routerLinkActive="bg-white/10 text-white"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition"
        >
          <span>🏠</span>
          Dashboard
        </a>

        <a
          routerLink="/admin/products"
          routerLinkActive="bg-white/10 text-white"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition"
        >
          <span>📦</span>
          Products
        </a>

        <a
          routerLink="/admin/categories"
          routerLinkActive="bg-white/10 text-white"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition"
        >
          <span>📁</span>
          Categories
        </a>

        <a
          routerLink="/admin/locations"
          routerLinkActive="bg-white/10 text-white"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition"
        >
          <span>📍</span>
          Locations
        </a>

        <a
          routerLink="/admin/suppliers"
          routerLinkActive="bg-white/10 text-white"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition"
        >
          <span>🏭</span>
          Suppliers
        </a>

        <a
          routerLink="/admin/inventory"
          routerLinkActive="bg-white/10 text-white"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition"
        >
          <span>📋</span>
          Inventory
        </a>

        <a
          routerLink="/admin/reports"
          routerLinkActive="bg-white/10 text-white"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition"
        >
          <span>📊</span>
          Reports
        </a>
      </div>
    </nav>
  `,
})
export class SidebarNavComponent {}

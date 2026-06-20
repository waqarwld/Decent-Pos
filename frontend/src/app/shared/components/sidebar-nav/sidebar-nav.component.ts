import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="w-56 min-h-screen bg-gray-900 text-gray-300 flex flex-col py-4">
      <ul class="flex flex-col gap-1 px-2">
        @for (item of navItems; track item.route) {
          <li>
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-gray-700 text-white font-semibold"
              class="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-700 hover:text-white transition-colors"
              [attr.aria-label]="item.label"
            >
              <span class="text-base" aria-hidden="true">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class SidebarNavComponent {
  protected readonly navItems: NavItem[] = [
    { label: 'Products',   route: '/admin/products',   icon: '📦' },
    { label: 'Categories', route: '/admin/categories', icon: '🏷️' },
    { label: 'Locations',  route: '/admin/locations',  icon: '📍' },
    { label: 'Suppliers',  route: '/admin/suppliers',  icon: '🚚' },
    { label: 'Inventory',  route: '/admin/inventory',  icon: '🗃️' },
    { label: 'Reports',    route: '/admin/reports',    icon: '📊' },
  ];
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopNavComponent } from '../../../shared/components/top-nav/top-nav.component';
import { SidebarNavComponent } from '../../../shared/components/sidebar-nav/sidebar-nav.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, TopNavComponent, SidebarNavComponent],
  template: `
    <app-top-nav />
    <div class="flex">
      <app-sidebar-nav />
      <main class="flex-1 p-4">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminShellComponent {}

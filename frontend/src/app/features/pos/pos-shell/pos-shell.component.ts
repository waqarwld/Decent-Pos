import { Component, inject } from '@angular/core';
import { TopNavComponent } from '../../../shared/components/top-nav/top-nav.component';
import { ProductSearchComponent } from '../product-search/product-search.component';
import { TransactionPanelComponent } from '../transaction-panel/transaction-panel.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { Product } from '../../../core/models/product';

@Component({
  selector: 'app-pos-shell',
  standalone: true,
  imports: [TopNavComponent, ProductSearchComponent, TransactionPanelComponent],
  template: `
    <!-- Top navigation bar -->
    <app-top-nav />

    <!-- Two-column POS layout -->
    <div class="flex h-[calc(100vh-56px)] overflow-hidden">

      <!-- Left column: product search -->
      <section
        class="flex flex-col flex-1 min-w-0 p-4 space-y-4 overflow-y-auto"
        aria-label="Product search"
      >
        <h1 class="text-xl font-bold text-gray-800">Point of Sale</h1>

        <app-product-search
          (productSelected)="onProductSelected($event)"
        />
      </section>

      <!-- Right column: transaction panel -->
      <aside
        class="w-96 flex-shrink-0 border-l border-gray-200 p-4 overflow-hidden flex flex-col"
        aria-label="Transaction panel"
      >
        <app-transaction-panel />
      </aside>

    </div>
  `,
})
export class PosShellComponent {
  private readonly transactionService = inject(TransactionService);

  onProductSelected(product: Product): void {
    this.transactionService.addProduct(product);
  }
}

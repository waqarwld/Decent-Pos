import { Component, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PosHeaderComponent } from '../pos-header/pos-header.component';
import { CategorySidebarComponent } from '../category-sidebar/category-sidebar.component';
import { ProductGridComponent } from '../product-grid/product-grid.component';
import { ProductCardComponent } from '../product-card/product-card.component';
import { TransactionPanelComponent } from '../transaction-panel/transaction-panel.component';
import { NumpadComponent } from '../../../shared/components/numpad/numpad.component';
import { PaymentOverlayComponent } from '../payment-overlay/payment-overlay.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { Product } from '../../../core/models/product';

@Component({
  selector: 'app-pos-shell',
  standalone: true,
  imports: [
    CommonModule,
    PosHeaderComponent,
    CategorySidebarComponent,
    ProductGridComponent,
    TransactionPanelComponent,
    NumpadComponent,
    PaymentOverlayComponent,
  ],
  template: `
    <div class="h-screen flex flex-col bg-pos-bg">
      <!-- Header -->
      <app-pos-header (productFound)="onProductFound($event)" />

      <!-- Main Content -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Category Sidebar -->
        <aside class="w-56 shrink-0 hidden md:block">
          <app-category-sidebar (categorySelected)="onCategorySelected($event)" />
        </aside>

        <!-- Product Grid -->
        <main class="flex-1 min-w-0">
          <app-product-grid
            #productGrid
            (productAdd)="onProductAdd($event)"
          />
        </main>

        <!-- Transaction Panel -->
        <aside class="w-96 shrink-0 hidden lg:block border-l border-pos-surface-light">
          <app-transaction-panel
            (showNumpad)="onShowNumpad($event)"
            (showPayment)="showPayment.set(true)"
          />
        </aside>
      </div>

      <!-- Mobile Cart Toggle -->
      <button
        type="button"
        (click)="mobileCartOpen.set(true)"
        class="lg:hidden fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-pos-accent text-pos-bg flex items-center justify-center shadow-lg hover:bg-pos-accent-hover transition"
      >
        <span class="text-xl">🛒</span>
        @if (transactionService.items().length > 0) {
          <span class="absolute -top-1 -right-1 w-5 h-5 bg-pos-danger rounded-full text-xs flex items-center justify-center font-bold">
            {{ transactionService.items().length }}
          </span>
        }
      </button>

      <!-- Mobile Cart Drawer -->
      @if (mobileCartOpen()) {
        <div class="lg:hidden fixed inset-0 z-50" (click)="mobileCartOpen.set(false)">
          <div class="absolute inset-y-0 right-0 w-full max-w-md bg-pos-surface shadow-2xl" (click)="$event.stopPropagation()">
            <div class="h-full flex flex-col">
              <div class="flex items-center justify-between px-4 py-3 border-b border-pos-surface-light">
                <h2 class="text-lg font-bold text-pos-text">Cart</h2>
                <button (click)="mobileCartOpen.set(false)" class="text-pos-text-muted hover:text-pos-text text-2xl">✕</button>
              </div>
              <div class="flex-1 overflow-hidden">
                <app-transaction-panel
                  (showNumpad)="onShowNumpad($event)"
                  (showPayment)="showPayment.set(true)"
                />
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Numpad Overlay -->
      @if (showNumpad()) {
        <app-numpad
          [title]="numpadTitle()"
          [initialValue]="numpadInitialValue()"
          [minValue]="1"
          (confirm)="onNumpadConfirm($event)"
          (cancel)="showNumpad.set(false)"
        />
      }

      <!-- Payment Overlay -->
      @if (showPayment()) {
        <app-payment-overlay
          [total]="transactionService.total()"
          [locationId]="defaultLocationId"
          (completed)="onPaymentCompleted()"
          (cancelled)="showPayment.set(false)"
        />
      }
    </div>
  `,
})
export class PosShellComponent {
  @ViewChild('productGrid') productGrid!: ProductGridComponent;
  protected readonly transactionService = inject(TransactionService);

  readonly showNumpad = signal(false);
  readonly showPayment = signal(false);
  readonly mobileCartOpen = signal(false);
  readonly numpadTitle = signal('Quantity');
  readonly numpadInitialValue = signal(1);
  readonly numpadTargetProduct = signal<Product | null>(null);

  readonly defaultLocationId = 1;

  onProductFound(product: Product): void {
    this.transactionService.addProduct(product);
  }

  onProductAdd(product: Product): void {
    this.numpadTargetProduct.set(product);
    this.numpadTitle.set(product.name);
    this.numpadInitialValue.set(1);
    this.showNumpad.set(true);
  }

  onCategorySelected(categoryId: number | null): void {
    this.productGrid?.setCategoryFilter(categoryId);
  }

  onShowNumpad(event: { product: Product; currentQty: number }): void {
    this.numpadTargetProduct.set(event.product);
    this.numpadTitle.set(event.product.name);
    this.numpadInitialValue.set(event.currentQty);
    this.showNumpad.set(true);
  }

  onNumpadConfirm(quantity: number): void {
    this.showNumpad.set(false);
    const product = this.numpadTargetProduct();
    if (!product) return;

    const currentItems = this.transactionService.items();
    const existing = currentItems.find((i) => i.product.id === product.id);

    if (existing) {
      // Update existing item quantity
      const diff = quantity - existing.quantity;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          this.transactionService.increment(product.id);
        }
      } else if (diff < 0) {
        for (let i = 0; i < Math.abs(diff); i++) {
          this.transactionService.decrement(product.id);
        }
      }
    } else {
      // Add new item with specified quantity
      this.transactionService.addProduct(product);
      for (let i = 1; i < quantity; i++) {
        this.transactionService.increment(product.id);
      }
    }
  }

  onPaymentCompleted(): void {
    this.showPayment.set(false);
    this.transactionService.clear();
  }
}

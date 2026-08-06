import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionItemComponent } from '../transaction-item/transaction-item.component';
import { Product } from '../../../core/models/product';

@Component({
  selector: 'app-transaction-panel',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, TransactionItemComponent],
  template: `
    <div class="h-full flex flex-col bg-pos-surface border-l border-pos-surface-light">
      <!-- Header -->
      <div class="px-4 py-3 bg-pos-surface-light border-b border-pos-surface-light flex items-center justify-between">
        <h2 class="text-base font-semibold text-pos-text">
          Cart
          @if (transactionService.items().length > 0) {
            <span class="ml-2 text-xs bg-pos-accent text-pos-bg px-2 py-0.5 rounded-full">
              {{ transactionService.items().length }}
            </span>
          }
        </h2>
        <button
          type="button"
          (click)="onClearCart()"
          [disabled]="transactionService.items().length === 0"
          class="text-xs text-pos-danger hover:text-pos-danger/80 disabled:text-pos-text-muted/30 transition"
        >
          Clear
        </button>
      </div>

      <!-- Empty State -->
      @if (transactionService.items().length === 0) {
        <div class="flex-1 flex flex-col items-center justify-center text-center px-6">
          <span class="text-5xl mb-4 opacity-20">🛒</span>
          <p class="text-pos-text-muted text-sm">Cart is empty</p>
          <p class="text-pos-text-muted/60 text-xs mt-1">Tap a product to add it</p>
        </div>
      } @else {
        <!-- Items list -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          @for (item of transactionService.items(); track item.product.id) {
            <app-transaction-item
              [item]="item"
              (increment)="transactionService.increment($event)"
              (decrement)="transactionService.decrement($event)"
              (remove)="transactionService.remove($event)"
              (editQty)="onEditQuantity(item.product, item.quantity)"
            />
          }
        </div>
      }

      <!-- Footer: Total + Actions -->
      <div class="px-4 py-4 bg-pos-surface-light border-t border-pos-surface-light space-y-4">

        <!-- Error message -->
        @if (transactionService.error()) {
          <div
            role="alert"
            class="rounded-lg bg-pos-danger/10 px-3 py-2.5 text-sm text-pos-danger border border-pos-danger/20"
          >
            {{ transactionService.error() }}
          </div>
        }

        <!-- Success message -->
        @if (successMessage()) {
          <div
            role="status"
            class="rounded-lg bg-pos-success/10 px-3 py-2.5 text-sm text-pos-success border border-pos-success/20"
          >
            {{ successMessage() }}
          </div>
        }

        <!-- Totals -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-pos-text-muted">Subtotal</span>
            <span class="text-sm text-pos-text">{{ transactionService.total() | currency }}</span>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-pos-surface-light">
            <span class="text-lg font-semibold text-pos-text">Total</span>
            <span class="text-2xl font-bold text-pos-accent">{{ transactionService.total() | currency }}</span>
          </div>
        </div>

        <!-- Pay Button -->
        <button
          type="button"
          (click)="onPay()"
          [disabled]="transactionService.items().length === 0"
          class="w-full rounded-xl bg-pos-accent px-4 py-4 text-lg font-bold text-pos-bg hover:bg-pos-accent-hover focus:outline-none focus:ring-2 focus:ring-pos-accent disabled:bg-pos-accent/30 disabled:cursor-not-allowed transition"
        >
          Pay Now
        </button>
      </div>
    </div>
  `,
})
export class TransactionPanelComponent {
  protected readonly transactionService = inject(TransactionService);

  @Output() showNumpad = new EventEmitter<{ product: Product; currentQty: number }>();
  @Output() showPayment = new EventEmitter<void>();

  readonly successMessage = signal<string | null>(null);

  onEditQuantity(product: Product, currentQty: number): void {
    this.showNumpad.emit({ product, currentQty });
  }

  onClearCart(): void {
    if (this.transactionService.items().length === 0) return;
    if (confirm('Clear all items from cart?')) {
      this.transactionService.clear();
      this.successMessage.set(null);
    }
  }

  onPay(): void {
    if (this.transactionService.items().length === 0) return;
    this.showPayment.emit();
  }
}

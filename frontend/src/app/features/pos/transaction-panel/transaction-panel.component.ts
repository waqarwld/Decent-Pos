import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionItemComponent } from '../transaction-item/transaction-item.component';

@Component({
  selector: 'app-transaction-panel',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, TransactionItemComponent],
  template: `
    <div class="flex flex-col h-full bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">

      <!-- Header -->
      <div class="px-4 py-3 bg-white border-b border-gray-200">
        <h2 class="text-base font-semibold text-gray-800">Current Transaction</h2>
      </div>

      <!-- Items list -->
      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        @if (transactionService.items().length === 0) {
          <p class="text-sm text-gray-400 text-center py-8">No items added yet.</p>
        } @else {
          @for (item of transactionService.items(); track item.product.id) {
            <app-transaction-item
              [item]="item"
              (increment)="onIncrement($event)"
              (decrement)="onDecrement($event)"
              (remove)="onRemove($event)"
            />
          }
        }
      </div>

      <!-- Footer: total + submit -->
      <div class="px-4 py-4 bg-white border-t border-gray-200 space-y-3">

        <!-- Running total -->
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-600">Total</span>
          <span class="text-lg font-bold text-gray-900">
            {{ transactionService.total() | currency }}
          </span>
        </div>

        <!-- Error message -->
        @if (transactionService.error()) {
          <div
            role="alert"
            class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200"
          >
            {{ transactionService.error() }}
          </div>
        }

        <!-- Success message -->
        @if (successMessage()) {
          <div
            role="status"
            class="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200"
          >
            {{ successMessage() }}
          </div>
        }

        <!-- Complete Transaction button -->
        <button
          type="button"
          (click)="onCompleteTransaction()"
          [disabled]="transactionService.items().length === 0 || submitting()"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white
                 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          @if (submitting()) {
            Processing…
          } @else {
            Complete Transaction
          }
        </button>

      </div>
    </div>
  `,
})
export class TransactionPanelComponent {
  protected readonly transactionService = inject(TransactionService);

  protected readonly submitting = signal(false);
  protected readonly successMessage = signal<string | null>(null);

  /**
   * Default location ID used when submitting.
   * In a real app this would come from a store/location selector.
   * Using 1 as a sensible default for the POS shell.
   */
  private readonly defaultLocationId = 1;

  onIncrement(productId: number): void {
    this.transactionService.increment(productId);
  }

  onDecrement(productId: number): void {
    this.transactionService.decrement(productId);
  }

  onRemove(productId: number): void {
    this.transactionService.remove(productId);
  }

  onCompleteTransaction(): void {
    if (this.transactionService.items().length === 0 || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);

    this.transactionService.submit(this.defaultLocationId).subscribe({
      next: () => {
        this.transactionService.clear();
        this.successMessage.set('Transaction completed successfully.');
        this.submitting.set(false);
      },
      error: () => {
        // Error is already surfaced via transactionService.error signal
        this.submitting.set(false);
      },
    });
  }
}

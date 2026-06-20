import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TransactionItem } from '../../../core/models/transaction';

@Component({
  selector: 'app-transaction-item',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between gap-4 py-3 px-4 bg-white border border-gray-200 rounded-lg">

      <!-- Product info -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-900 truncate">{{ item.product.name }}</p>
        <p class="text-xs text-gray-500 mt-0.5">{{ item.product.price | currency }}</p>
      </div>

      <!-- Quantity controls -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          (click)="onDecrement()"
          aria-label="Decrease quantity"
          class="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          −
        </button>

        <span class="w-6 text-center text-sm font-medium text-gray-800">{{ item.quantity }}</span>

        <button
          type="button"
          (click)="onIncrement()"
          aria-label="Increase quantity"
          class="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          +
        </button>
      </div>

      <!-- Line total -->
      <div class="text-sm font-semibold text-gray-900 shrink-0 w-20 text-right">
        {{ lineTotal | currency }}
      </div>

      <!-- Remove button -->
      <button
        type="button"
        (click)="onRemove()"
        aria-label="Remove item"
        class="ml-2 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 rounded transition shrink-0"
        title="Remove"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

    </div>
  `,
})
export class TransactionItemComponent {
  @Input({ required: true }) item!: TransactionItem;

  @Output() increment = new EventEmitter<number>();
  @Output() decrement = new EventEmitter<number>();
  @Output() remove = new EventEmitter<number>();

  get lineTotal(): number {
    return this.item.product.price * this.item.quantity;
  }

  onIncrement(): void {
    this.increment.emit(this.item.product.id);
  }

  onDecrement(): void {
    this.decrement.emit(this.item.product.id);
  }

  onRemove(): void {
    this.remove.emit(this.item.product.id);
  }
}

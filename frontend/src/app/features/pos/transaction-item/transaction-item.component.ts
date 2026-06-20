import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TransactionItem } from '../../../core/models/transaction';

@Component({
  selector: 'app-transaction-item',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3 p-3 bg-pos-surface-light rounded-xl border border-pos-surface-light">

      <!-- Product info -->
      <div class="flex-1 min-w-0" (click)="onEditQty()">
        <p class="text-sm font-semibold text-pos-text truncate">{{ item.product.name }}</p>
        <p class="text-xs text-pos-text-muted mt-0.5">{{ item.product.price | currency }} each</p>
      </div>

      <!-- Quantity controls -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          type="button"
          (click)="onDecrement()"
          aria-label="Decrease quantity"
          class="w-9 h-9 flex items-center justify-center rounded-lg bg-pos-bg text-pos-text hover:bg-pos-surface-light border border-pos-surface-light transition active:scale-95"
        >
          <span class="text-lg leading-none">−</span>
        </button>

        <button
          type="button"
          (click)="onEditQty()"
          class="w-10 h-9 flex items-center justify-center rounded-lg bg-pos-bg text-pos-text font-bold text-sm border border-pos-surface-light hover:border-pos-accent transition"
        >
          {{ item.quantity }}
        </button>

        <button
          type="button"
          (click)="onIncrement()"
          aria-label="Increase quantity"
          class="w-9 h-9 flex items-center justify-center rounded-lg bg-pos-bg text-pos-text hover:bg-pos-surface-light border border-pos-surface-light transition active:scale-95"
        >
          <span class="text-lg leading-none">+</span>
        </button>
      </div>

      <!-- Line total -->
      <div class="text-sm font-bold text-pos-accent shrink-0 w-16 text-right">
        {{ lineTotal | currency }}
      </div>

      <!-- Remove button -->
      <button
        type="button"
        (click)="onRemove()"
        aria-label="Remove item"
        class="w-8 h-8 flex items-center justify-center rounded-lg text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger/10 transition shrink-0"
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
  @Output() editQty = new EventEmitter<number>();

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

  onEditQty(): void {
    this.editQty.emit(this.item.product.id);
  }
}

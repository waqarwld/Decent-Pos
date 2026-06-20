import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Product } from '../../../core/models/product';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <button
      type="button"
      (click)="onAdd()"
      class="w-full bg-pos-surface-light border border-pos-surface-light rounded-xl p-4 flex flex-col items-center text-center gap-3 hover:border-pos-accent hover:shadow-lg hover:shadow-pos-accent/10 transition active:scale-95 select-none"
    >
      <!-- Image Placeholder -->
      <div class="w-full aspect-square max-w-[120px] rounded-lg bg-pos-bg flex items-center justify-center">
        <span class="text-4xl opacity-50">📦</span>
      </div>

      <!-- Info -->
      <div class="flex flex-col items-center gap-1 w-full">
        <p class="text-sm font-semibold text-pos-text leading-tight line-clamp-2">{{ product.name }}</p>
        <p class="text-xs text-pos-text-muted">{{ product.sku }}</p>
        <p class="text-lg font-bold text-pos-accent">{{ product.price | currency }}</p>
      </div>
    </button>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() add = new EventEmitter<Product>();

  onAdd(): void {
    this.add.emit(this.product);
  }
}

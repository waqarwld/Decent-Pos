import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, throwError } from 'rxjs';
import { Product } from '../models/product';
import { TransactionItem } from '../models/transaction';
import { InventoryService } from './inventory.service';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly inventoryService = inject(InventoryService);

  /** Writable signal holding the current list of transaction items */
  private readonly _items = signal<TransactionItem[]>([]);

  /** Read-only view of the items signal */
  readonly items = this._items.asReadonly();

  /** Computed running total: sum of (price × quantity) for all items */
  readonly total = computed(() =>
    this._items().reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0)
  );

  /** Signal that surfaces the last submission error, or null when no error */
  private readonly _error = signal<string | null>(null);

  /** Read-only view of the error signal */
  readonly error = this._error.asReadonly();

  /**
   * Adds a product to the transaction with quantity 1.
   * If the product is already present, increments its quantity instead.
   */
  addProduct(product: Product): void {
    const current = this._items();
    const existingIndex = current.findIndex((item) => item.product.id === product.id);

    if (existingIndex >= 0) {
      const updated = current.map((item, index) =>
        index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
      this._items.set(updated);
    } else {
      this._items.set([...current, { product, quantity: 1 }]);
    }
  }

  /**
   * Increments the quantity of the item with the given productId by 1.
   * No-op if the product is not in the transaction.
   */
  increment(productId: number): void {
    this._items.set(
      this._items().map((item) =>
        item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  /**
   * Decrements the quantity of the item with the given productId by 1.
   * Removes the item entirely when quantity reaches 0.
   * No-op if the product is not in the transaction.
   */
  decrement(productId: number): void {
    const updated = this._items()
      .map((item) =>
        item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      )
      .filter((item) => item.quantity > 0);
    this._items.set(updated);
  }

  /**
   * Removes the item with the given productId from the transaction entirely.
   * No-op if the product is not in the transaction.
   */
  remove(productId: number): void {
    this._items.set(this._items().filter((item) => item.product.id !== productId));
  }

  /**
   * Submits the current transaction by POSTing a ship request for each line item.
   * On success: clears the transaction items and resets the error signal.
   * On any error: preserves the current items and surfaces the error via the error signal.
   *
   * @param locationId - The location ID to ship from
   * @returns Observable that completes on success or errors on failure
   */
  submit(locationId: number): Observable<unknown[]> {
    const items = this._items();

    if (items.length === 0) {
      return throwError(() => new Error('No items in transaction'));
    }

    const requests = items.map((item) =>
      this.inventoryService.ship({
        product_id: item.product.id,
        location_id: locationId,
        quantity: item.quantity,
      })
    );

    return forkJoin(requests).pipe(
      map((results) => {
        const failures = results.filter((r) => !r.success);
        if (failures.length > 0) {
          const msg = failures.map((f) => f.message).join('; ');
          this._error.set(msg);
          throw new Error(msg);
        }
        this._error.set(null);
        this._items.set([]);
        return results;
      }),
      catchError((err) => {
        const message: string =
          err?.error?.message ?? err?.error?.error ?? err?.message ?? 'Submission failed';
        this._error.set(message);
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Resets the transaction to an empty state and clears any error.
   * Should be called after a successful submission.
   */
  clear(): void {
    this._items.set([]);
    this._error.set(null);
  }
}

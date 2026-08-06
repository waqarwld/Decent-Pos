import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Product } from '../models/product';
import { TransactionItem } from '../models/transaction';
import { CheckoutRequest, Customer, Sale } from '../models/customer';
import { SaleService } from './sale.service';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly saleService = inject(SaleService);

  /** Writable signal holding the current list of transaction items */
  private readonly _items = signal<TransactionItem[]>([]);

  /** Read-only view of the items signal */
  readonly items = this._items.asReadonly();

  /** The customer the current transaction is being sold to (null = walk-in) */
  private readonly _customer = signal<Customer | null>(null);

  /** Read-only view of the selected customer */
  readonly customer = this._customer.asReadonly();

  /** Computed running total, applying the wholesale price for wholesale customers */
  readonly total = computed(() =>
    this._items().reduce((sum, item) => sum + this.unitPrice(item) * item.quantity, 0)
  );

  /** Signal that surfaces the last submission error, or null when no error */
  private readonly _error = signal<string | null>(null);

  /** Read-only view of the error signal */
  readonly error = this._error.asReadonly();

  /** Price charged for a line, based on the selected customer's type */
  private unitPrice(item: TransactionItem): number {
    const customer = this._customer();
    if (customer?.customer_type === 'wholesale' && item.product.wholesale_price != null) {
      return item.product.wholesale_price;
    }
    return item.product.price ?? 0;
  }

  /** Attach a customer to the current transaction (null = walk-in, no account). */
  setCustomer(customer: Customer | null): void {
    this._customer.set(customer);
  }

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
   * Submits the transaction as a single sale: records the sale (with the selected
   * customer and payment method), charges wholesale/retail price, and decrements
   * stock on the backend. On success clears the transaction items and error.
   *
   * @param opts.locationId - The location the sale happens at
   * @param opts.paymentMethod - cash | card | split | other
   */
  submit(opts: { locationId: number; paymentMethod: string }): Observable<Sale> {
    const items = this._items();

    if (items.length === 0) {
      return throwError(() => new Error('No items in transaction'));
    }

    const req: CheckoutRequest = {
      customer_id: this._customer()?.id,
      location_id: opts.locationId,
      payment_method: opts.paymentMethod,
      items: items.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
    };

    return this.saleService.checkout(req).pipe(
      map((sale) => {
        this._error.set(null);
        this._items.set([]);
        return sale;
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
   * Resets the transaction to an empty state and clears any error and customer.
   * Should be called after a successful submission.
   */
  clear(): void {
    this._items.set([]);
    this._error.set(null);
    this._customer.set(null);
  }
}
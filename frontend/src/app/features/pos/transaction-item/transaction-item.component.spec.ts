import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionItemComponent } from './transaction-item.component';
import { TransactionItem } from '../../../core/models/transaction';
import { Product } from '../../../core/models/product';

// Minimal Product factory
function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    sku: 'SKU-001',
    name: 'Test Product',
    price: 9.99,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Minimal TransactionItem factory
function makeItem(productOverrides: Partial<Product> = {}, quantity = 1): TransactionItem {
  return { product: makeProduct(productOverrides), quantity };
}

// Helper: instantiate component and set an item input
function buildComponent(item: TransactionItem): TransactionItemComponent {
  const comp = new TransactionItemComponent();
  comp.item = item;
  return comp;
}

describe('TransactionItemComponent', () => {
  describe('lineTotal getter', () => {
    it('returns price × quantity for a single-unit item', () => {
      const comp = buildComponent(makeItem({ price: 10.0 }, 1));
      expect(comp.lineTotal).toBeCloseTo(10.0);
    });

    it('returns correct total for quantity > 1', () => {
      const comp = buildComponent(makeItem({ price: 4.5 }, 3));
      expect(comp.lineTotal).toBeCloseTo(13.5);
    });

    it('returns 0 when price is 0', () => {
      const comp = buildComponent(makeItem({ price: 0 }, 5));
      expect(comp.lineTotal).toBe(0);
    });
  });

  describe('onIncrement()', () => {
    it('emits the product id via the increment EventEmitter', () => {
      const item = makeItem({ id: 42 }, 2);
      const comp = buildComponent(item);
      const emittedValues: number[] = [];
      comp.increment.subscribe((id: number) => emittedValues.push(id));

      comp.onIncrement();

      expect(emittedValues).toHaveLength(1);
      expect(emittedValues[0]).toBe(42);
    });

    it('does not emit on decrement or remove EventEmitters', () => {
      const comp = buildComponent(makeItem({ id: 7 }));
      const decrementSpy = vi.fn();
      const removeSpy = vi.fn();
      comp.decrement.subscribe(decrementSpy);
      comp.remove.subscribe(removeSpy);

      comp.onIncrement();

      expect(decrementSpy).not.toHaveBeenCalled();
      expect(removeSpy).not.toHaveBeenCalled();
    });
  });

  describe('onDecrement()', () => {
    it('emits the product id via the decrement EventEmitter', () => {
      const item = makeItem({ id: 99 }, 3);
      const comp = buildComponent(item);
      const emittedValues: number[] = [];
      comp.decrement.subscribe((id: number) => emittedValues.push(id));

      comp.onDecrement();

      expect(emittedValues).toHaveLength(1);
      expect(emittedValues[0]).toBe(99);
    });

    it('does not emit on increment or remove EventEmitters', () => {
      const comp = buildComponent(makeItem({ id: 5 }));
      const incrementSpy = vi.fn();
      const removeSpy = vi.fn();
      comp.increment.subscribe(incrementSpy);
      comp.remove.subscribe(removeSpy);

      comp.onDecrement();

      expect(incrementSpy).not.toHaveBeenCalled();
      expect(removeSpy).not.toHaveBeenCalled();
    });
  });

  describe('onRemove()', () => {
    it('emits the product id via the remove EventEmitter', () => {
      const item = makeItem({ id: 13 }, 1);
      const comp = buildComponent(item);
      const emittedValues: number[] = [];
      comp.remove.subscribe((id: number) => emittedValues.push(id));

      comp.onRemove();

      expect(emittedValues).toHaveLength(1);
      expect(emittedValues[0]).toBe(13);
    });

    it('does not emit on increment or decrement EventEmitters', () => {
      const comp = buildComponent(makeItem({ id: 2 }));
      const incrementSpy = vi.fn();
      const decrementSpy = vi.fn();
      comp.increment.subscribe(incrementSpy);
      comp.decrement.subscribe(decrementSpy);

      comp.onRemove();

      expect(incrementSpy).not.toHaveBeenCalled();
      expect(decrementSpy).not.toHaveBeenCalled();
    });
  });

  describe('event emitters emit the correct productId', () => {
    it('always emits item.product.id regardless of quantity', () => {
      const product = makeProduct({ id: 55, price: 3.0 });
      for (const qty of [1, 2, 5, 10]) {
        const comp = buildComponent({ product, quantity: qty });
        const incrementIds: number[] = [];
        const decrementIds: number[] = [];
        const removeIds: number[] = [];

        comp.increment.subscribe((id: number) => incrementIds.push(id));
        comp.decrement.subscribe((id: number) => decrementIds.push(id));
        comp.remove.subscribe((id: number) => removeIds.push(id));

        comp.onIncrement();
        comp.onDecrement();
        comp.onRemove();

        expect(incrementIds[0]).toBe(55);
        expect(decrementIds[0]).toBe(55);
        expect(removeIds[0]).toBe(55);
      }
    });
  });
});

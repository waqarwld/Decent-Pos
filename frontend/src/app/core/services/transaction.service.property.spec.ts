// Feature: pos-frontend, Property 6: Transaction item management
// Feature: pos-frontend, Property 7: Running total invariant
// Feature: pos-frontend, Property 9: API error preserves transaction state

import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock Angular's inject() so we can instantiate TransactionService without TestBed
const { mockInject } = vi.hoisted(() => ({ mockInject: vi.fn() }));

vi.mock('@angular/core', async () => {
  const actual = await vi.importActual<typeof import('@angular/core')>('@angular/core');
  return { ...actual, inject: mockInject };
});

import { TransactionService } from './transaction.service';
import { Product } from '../models/product';

// Validates: Requirements 2.3, 2.4, 2.5

/** Arbitrary that generates a minimal valid Product */
const productArb = fc.record({
  id: fc.integer({ min: 1, max: 10_000 }),
  sku: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99), noNaN: true }),
  created_at: fc.constant('2024-01-01T00:00:00Z'),
  updated_at: fc.constant('2024-01-01T00:00:00Z'),
}) as fc.Arbitrary<Product>;

/** Create a fresh TransactionService instance with a mocked InventoryService */
function makeService(): TransactionService {
  const mockInventoryService = {} as any;
  mockInject.mockReturnValue(mockInventoryService);
  return new TransactionService();
}

describe('TransactionService — Property 6: Transaction item management', () => {
  beforeEach(() => {
    mockInject.mockReset();
  });

  it('Property 6a: adding a new product results in quantity 1', () => {
    fc.assert(
      fc.property(productArb, (product) => {
        const service = makeService();

        service.addProduct(product);

        const items = service.items();
        const added = items.find((item) => item.product.id === product.id);
        expect(added).toBeDefined();
        expect(added!.quantity).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 6b: adding the same product twice increments quantity to 2 (not a duplicate entry)', () => {
    fc.assert(
      fc.property(productArb, (product) => {
        const service = makeService();

        service.addProduct(product);
        service.addProduct(product);

        const items = service.items();
        const matching = items.filter((item) => item.product.id === product.id);
        expect(matching.length).toBe(1);
        expect(matching[0].quantity).toBe(2);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 6c: increment increases quantity by 1', () => {
    fc.assert(
      fc.property(
        productArb,
        fc.integer({ min: 0, max: 5 }),
        (product, extraIncrements) => {
          const service = makeService();

          service.addProduct(product); // quantity = 1
          for (let i = 0; i < extraIncrements; i++) {
            service.increment(product.id);
          }
          const quantityBefore = service.items().find((item) => item.product.id === product.id)!.quantity;

          service.increment(product.id);

          const quantityAfter = service.items().find((item) => item.product.id === product.id)!.quantity;
          expect(quantityAfter).toBe(quantityBefore + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6d: decrement decreases quantity by 1 when quantity > 1', () => {
    fc.assert(
      fc.property(
        productArb,
        fc.integer({ min: 1, max: 5 }),
        (product, extraIncrements) => {
          const service = makeService();

          service.addProduct(product); // quantity = 1
          for (let i = 0; i < extraIncrements; i++) {
            service.increment(product.id);
          }
          // quantity is now 1 + extraIncrements (>= 2 when extraIncrements >= 1)
          const quantityBefore = service.items().find((item) => item.product.id === product.id)!.quantity;
          fc.pre(quantityBefore > 1);

          service.decrement(product.id);

          const quantityAfter = service.items().find((item) => item.product.id === product.id)!.quantity;
          expect(quantityAfter).toBe(quantityBefore - 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6e: decrement at quantity 1 removes the item from the transaction', () => {
    fc.assert(
      fc.property(productArb, (product) => {
        const service = makeService();

        service.addProduct(product); // quantity = 1
        expect(service.items().find((item) => item.product.id === product.id)).toBeDefined();

        service.decrement(product.id); // should remove the item

        const remaining = service.items().find((item) => item.product.id === product.id);
        expect(remaining).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('Property 6f: explicit remove removes the item regardless of quantity', () => {
    fc.assert(
      fc.property(
        productArb,
        fc.integer({ min: 1, max: 10 }),
        (product, quantity) => {
          const service = makeService();

          service.addProduct(product); // quantity = 1
          for (let i = 1; i < quantity; i++) {
            service.increment(product.id);
          }
          // quantity is now `quantity`
          expect(service.items().find((item) => item.product.id === product.id)).toBeDefined();

          service.remove(product.id);

          const remaining = service.items().find((item) => item.product.id === product.id);
          expect(remaining).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6g: removing a product does not affect other products in the transaction', () => {
    fc.assert(
      fc.property(
        productArb,
        productArb,
        (productA, productB) => {
          // Ensure distinct IDs
          fc.pre(productA.id !== productB.id);

          const service = makeService();

          service.addProduct(productA);
          service.addProduct(productB);

          service.remove(productA.id);

          const itemsAfter = service.items();
          expect(itemsAfter.find((item) => item.product.id === productA.id)).toBeUndefined();
          expect(itemsAfter.find((item) => item.product.id === productB.id)).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: pos-frontend, Property 7: Running total invariant
// Validates: Requirements 2.5

describe('TransactionService — Property 7: Running total invariant', () => {
  beforeEach(() => {
    mockInject.mockReset();
  });

  it('Property 7: total equals sum of (price × quantity) for all items in the transaction', () => {
    // Arbitrary for a single transaction item entry: non-negative price, positive integer quantity
    const itemArb = fc.record({
      price: fc.float({ min: 0, max: Math.fround(9999.99), noNaN: true, noDefaultInfinity: true }),
      qty: fc.integer({ min: 1, max: 100 }),
    });

    fc.assert(
      fc.property(fc.array(itemArb, { minLength: 0, maxLength: 20 }), (itemDefs) => {
        const service = makeService();

        // Build unique products from the item definitions and add them with the right quantities
        let productId = 1;
        for (const { price, qty } of itemDefs) {
          const product: Product = {
            id: productId++,
            sku: `SKU-${productId}`,
            name: `Product ${productId}`,
            price,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          };

          // addProduct sets quantity to 1; increment (qty - 1) more times to reach desired qty
          service.addProduct(product);
          for (let i = 1; i < qty; i++) {
            service.increment(product.id);
          }
        }

        // Compute expected total manually
        const expectedTotal = itemDefs.reduce((sum, { price, qty }) => sum + price * qty, 0);

        expect(service.total()).toBeCloseTo(expectedTotal, 5);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: pos-frontend, Property 8: Transaction submission calls ship per line item
// Validates: Requirements 2.6

describe('TransactionService — Property 8: Transaction submission calls ship per line item', () => {
  beforeEach(() => {
    mockInject.mockReset();
  });

  it('Property 8: submit() dispatches exactly N POST requests to /api/v1/inventory/ship for N line items', () => {
    // Arbitrary for a non-empty list of distinct products with positive quantities
    const itemArb = fc.record({
      id: fc.integer({ min: 1, max: 10_000 }),
      sku: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99), noNaN: true }),
      created_at: fc.constant('2024-01-01T00:00:00Z'),
      updated_at: fc.constant('2024-01-01T00:00:00Z'),
    }) as fc.Arbitrary<Product>;

    const uniqueItemsArb = fc
      .array(itemArb, { minLength: 1, maxLength: 10 })
      .filter((items) => new Set(items.map((p) => p.id)).size === items.length);

    const locationIdArb = fc.integer({ min: 1, max: 1_000 });

    fc.assert(
      fc.property(uniqueItemsArb, locationIdArb, (products, locationId) => {
        // Track every call made to inventoryService.ship()
        const shipCalls: Array<{ product_id: number; location_id: number; quantity: number }> = [];
        const mockInventoryService = {
          ship: vi.fn((req: { product_id: number; location_id: number; quantity: number }) => {
            shipCalls.push(req);
            // Return an observable that immediately completes with a success result
            return new (require('rxjs').Observable)((subscriber: any) => {
              subscriber.next({ success: true, message: 'ok' });
              subscriber.complete();
            });
          }),
        };
        mockInject.mockReturnValue(mockInventoryService);
        const service = new TransactionService();

        // Add each product once (quantity = 1 per item)
        for (const product of products) {
          service.addProduct(product);
        }

        // Submit the transaction
        service.submit(locationId).subscribe();

        // Assert: exactly N ship() calls were made
        expect(shipCalls.length).toBe(products.length);

        // Assert: each line item has a corresponding ship() call with correct product_id, location_id, quantity
        for (const product of products) {
          const matchingCall = shipCalls.find((c) => c.product_id === product.id);
          expect(matchingCall).toBeDefined();
          expect(matchingCall!.location_id).toBe(locationId);
          expect(matchingCall!.quantity).toBe(1);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: pos-frontend, Property 9: API error preserves transaction state
// Validates: Requirements 2.8

describe('TransactionService — Property 9: API error preserves transaction state', () => {
  beforeEach(() => {
    mockInject.mockReset();
  });

  it('Property 9: when any ship API call returns an error, transaction items remain unchanged', () => {
    // Arbitrary for a non-empty list of distinct products
    const uniqueProductsArb = fc
      .array(productArb, { minLength: 1, maxLength: 10 })
      .filter((products) => new Set(products.map((p) => p.id)).size === products.length);

    // Arbitrary for an error response (simulates HTTP error from the API)
    const errorArb = fc.record({
      status: fc.integer({ min: 400, max: 599 }),
      message: fc.string({ minLength: 1, maxLength: 100 }),
    });

    // Arbitrary for which item index triggers the error (0-based)
    const failingIndexArb = (maxIndex: number) => fc.integer({ min: 0, max: maxIndex });

    fc.assert(
      fc.property(
        uniqueProductsArb,
        errorArb,
        (products, errorResponse) => {
          // Build a mock InventoryService that fails on the first ship() call
          let callCount = 0;
          const mockInventoryService = {
            ship: vi.fn((_req: unknown) => {
              callCount++;
              // The first call fails; subsequent calls would succeed (forkJoin short-circuits on error)
              return new (require('rxjs').Observable)((subscriber: any) => {
                subscriber.error({
                  error: { message: errorResponse.message },
                  status: errorResponse.status,
                });
              });
            }),
          };
          mockInject.mockReturnValue(mockInventoryService);
          const service = new TransactionService();

          // Add all products to the transaction
          for (const product of products) {
            service.addProduct(product);
          }

          // Capture the items state before submission
          const itemsBefore = service.items().map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          }));

          // Submit and ignore the error (we expect it to fail)
          service.submit(1).subscribe({ error: () => {} });

          // Capture the items state after the failed submission
          const itemsAfter = service.items().map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          }));

          // Assert: items are unchanged — same count, same product IDs, same quantities
          expect(itemsAfter.length).toBe(itemsBefore.length);
          for (const before of itemsBefore) {
            const after = itemsAfter.find((i) => i.productId === before.productId);
            expect(after).toBeDefined();
            expect(after!.quantity).toBe(before.quantity);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

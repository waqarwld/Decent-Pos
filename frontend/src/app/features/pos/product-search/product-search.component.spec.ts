import '@angular/compiler';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subject } from 'rxjs';

// Mock Angular's inject() so we can test without a full TestBed
const { mockInject } = vi.hoisted(() => ({ mockInject: vi.fn() }));

vi.mock('@angular/core', async () => {
  const actual = await vi.importActual<typeof import('@angular/core')>('@angular/core');
  return { ...actual, inject: mockInject };
});

import { ProductSearchComponent } from './product-search.component';
import { Product } from '../../../core/models/product';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function makeProductService(products: Product[] = []) {
  return {
    search: vi.fn(() =>
      of({ data: products, total: products.length, page: 1, page_size: 20 })
    ),
  };
}

function buildComponent(productService: ReturnType<typeof makeProductService>) {
  mockInject.mockReturnValue(productService as any);
  const component = new ProductSearchComponent();
  return component;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProductSearchComponent', () => {
  beforeEach(() => {
    mockInject.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('starts with empty results, no loading, no error', () => {
      const svc = makeProductService();
      const component = buildComponent(svc);
      component.ngOnInit();

      expect(component.results).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
      expect(component.showDropdown).toBe(false);

      component.ngOnDestroy();
    });
  });

  describe('Search debounce', () => {
    it('does NOT call ProductService before 500ms have elapsed', () => {
      const svc = makeProductService([makeProduct()]);
      const component = buildComponent(svc);
      component.ngOnInit();

      component.searchControl.setValue('apple');
      // advance only 499 ms — still within debounce window
      vi.advanceTimersByTime(499);

      expect(svc.search).not.toHaveBeenCalled();

      component.ngOnDestroy();
    });

    it('calls ProductService.search() after 500ms debounce', () => {
      const svc = makeProductService([makeProduct()]);
      const component = buildComponent(svc);
      component.ngOnInit();

      component.searchControl.setValue('apple');
      vi.advanceTimersByTime(500);

      expect(svc.search).toHaveBeenCalledOnce();
      expect(svc.search).toHaveBeenCalledWith('apple');

      component.ngOnDestroy();
    });

    it('calls ProductService.search() only once for rapid successive keystrokes', () => {
      const svc = makeProductService([makeProduct()]);
      const component = buildComponent(svc);
      component.ngOnInit();

      // Simulate rapid typing within the debounce window
      component.searchControl.setValue('a');
      vi.advanceTimersByTime(100);
      component.searchControl.setValue('ap');
      vi.advanceTimersByTime(100);
      component.searchControl.setValue('app');
      vi.advanceTimersByTime(100);
      component.searchControl.setValue('appl');
      vi.advanceTimersByTime(100);
      component.searchControl.setValue('apple');
      vi.advanceTimersByTime(500); // debounce fires here

      expect(svc.search).toHaveBeenCalledOnce();
      expect(svc.search).toHaveBeenCalledWith('apple');

      component.ngOnDestroy();
    });
  });

  describe('Result display', () => {
    it('populates results and shows dropdown after successful search', () => {
      const products = [makeProduct({ id: 1, name: 'Widget' }), makeProduct({ id: 2, name: 'Gadget' })];
      const svc = makeProductService(products);
      const component = buildComponent(svc);
      component.ngOnInit();

      component.searchControl.setValue('wid');
      vi.advanceTimersByTime(500);

      expect(component.results).toEqual(products);
      expect(component.showDropdown).toBe(true);
      expect(component.loading).toBe(false);

      component.ngOnDestroy();
    });

    it('clears results and hides dropdown when search input is empty', () => {
      const svc = makeProductService([makeProduct()]);
      const component = buildComponent(svc);
      component.ngOnInit();

      // First search
      component.searchControl.setValue('apple');
      vi.advanceTimersByTime(500);
      expect(component.results.length).toBeGreaterThan(0);

      // Clear the input
      component.searchControl.setValue('');
      vi.advanceTimersByTime(500);

      expect(component.results).toEqual([]);
      expect(component.showDropdown).toBe(false);

      component.ngOnDestroy();
    });

    it('trims whitespace before calling search', () => {
      const svc = makeProductService([makeProduct()]);
      const component = buildComponent(svc);
      component.ngOnInit();

      component.searchControl.setValue('  apple  ');
      vi.advanceTimersByTime(500);

      expect(svc.search).toHaveBeenCalledWith('apple');

      component.ngOnDestroy();
    });
  });

  describe('Product selection', () => {
    it('emits productSelected event when a product is selected', () => {
      const product = makeProduct({ id: 42, name: 'Selected Product' });
      const svc = makeProductService([product]);
      const component = buildComponent(svc);
      component.ngOnInit();

      const emitted: Product[] = [];
      component.productSelected.subscribe((p: Product) => emitted.push(p));

      component.selectProduct(product);

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual(product);

      component.ngOnDestroy();
    });

    it('clears search input and hides dropdown after product selection', () => {
      const product = makeProduct();
      const svc = makeProductService([product]);
      const component = buildComponent(svc);
      component.ngOnInit();

      // Simulate having results
      component.results = [product];
      component.showDropdown = true;

      component.selectProduct(product);

      expect(component.searchControl.value).toBe('');
      expect(component.results).toEqual([]);
      expect(component.showDropdown).toBe(false);

      component.ngOnDestroy();
    });
  });

  describe('Error handling', () => {
    it('sets error message and clears results when search fails', () => {
      const svc = {
        search: vi.fn(() => throwError(() => new Error('Network error'))),
      };
      mockInject.mockReturnValue(svc as any);
      const component = new ProductSearchComponent();
      component.ngOnInit();

      component.searchControl.setValue('fail');
      vi.advanceTimersByTime(500);

      expect(component.error).toBe('Network error');
      expect(component.results).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.showDropdown).toBe(false);

      component.ngOnDestroy();
    });
  });

  describe('Cleanup', () => {
    it('unsubscribes on destroy and stops calling the service after destruction', () => {
      const svc = makeProductService([makeProduct()]);
      const component = buildComponent(svc);
      component.ngOnInit();

      component.ngOnDestroy();

      // Type after destroy — should not trigger any service call
      component.searchControl.setValue('post-destroy query');
      vi.advanceTimersByTime(500);

      expect(svc.search).not.toHaveBeenCalled();
    });
  });
});

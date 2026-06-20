// Feature: pos-frontend, Property 10: Required field validation prevents form submission

import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { of } from 'rxjs';
import { FormBuilder } from '@angular/forms';

const { mockInject } = vi.hoisted(() => ({ mockInject: vi.fn() }));

vi.mock('@angular/core', async () => {
  const actual = await vi.importActual<typeof import('@angular/core')>('@angular/core');
  return { ...actual, inject: mockInject };
});

import { ProductFormComponent } from './product-form.component';

// ── Shared mock product returned by service calls ─────────────────────────────
const mockProduct = {
  id: 1,
  sku: 'TEST-001',
  name: 'Test Product',
  price: 9.99,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a fresh set of mocks and configure mockInject to return the right one.
 * Angular's inject() is called once per class property in declaration order:
 *   1. ProductService
 *   2. CategoryService
 *   3. ActivatedRoute
 *   4. Router
 *   5. FormBuilder
 */
function buildMocks() {
  const fb = new FormBuilder();

  const mockProductService = {
    create: vi.fn().mockReturnValue(of(mockProduct)),
    update: vi.fn().mockReturnValue(of(mockProduct)),
    getById: vi.fn().mockReturnValue(of(mockProduct)),
  };

  const mockCategoryService = {
    getAll: vi.fn().mockReturnValue(of([])),
  };

  // create mode — route has no :id param
  const mockRoute = {
    snapshot: { paramMap: { get: (_: string) => null } },
  };

  const mockRouter = {
    navigate: vi.fn(),
  };

  mockInject.mockImplementation((token: unknown) => {
    if (token === FormBuilder) return fb;
    if ((token as { name?: string })?.name === 'ProductService') return mockProductService;
    if ((token as { name?: string })?.name === 'CategoryService') return mockCategoryService;
    if ((token as { name?: string })?.name === 'ActivatedRoute') return mockRoute;
    if ((token as { name?: string })?.name === 'Router') return mockRouter;
    return undefined;
  });

  return { fb, mockProductService, mockCategoryService, mockRoute, mockRouter };
}

/** Create and initialise a component instance with fresh mocks. */
function createComponent() {
  const mocks = buildMocks();
  const component = new ProductFormComponent();
  component.ngOnInit();
  return { component, ...mocks };
}

// ── Arbitraries ───────────────────────────────────────────────────────────────

/**
 * Values that fail Angular's Validators.required (empty string or null).
 * Note: Validators.required treats whitespace-only strings as VALID —
 * only '' and null/undefined are invalid.
 */
const emptyOrNull = fc.oneof(
  fc.constant(''),
  fc.constant(null as unknown as string),
);

/** Non-empty, non-whitespace string — passes Validators.required */
const nonEmptyString = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

/** Positive number — passes Validators.required + Validators.min(0) */
const positiveNumber = fc.float({
  min: Math.fround(0.01),
  max: Math.fround(9999.99),
  noNaN: true,
  noDefaultInfinity: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 10a: Form is invalid when any required field is empty/null
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 3.7
 */
describe('ProductFormComponent — Property 10a: Form invalid when any required field is empty/null', () => {
  beforeEach(() => {
    mockInject.mockReset();
  });

  it('form is invalid when sku is empty/null regardless of other fields', () => {
    fc.assert(
      fc.property(
        emptyOrNull,
        nonEmptyString,
        positiveNumber,
        (invalidSku, validName, validPrice) => {
          const { component } = createComponent();

          component.form.patchValue({
            sku: invalidSku,
            name: validName,
            price: validPrice,
            description: '',
            category_id: null,
          });

          expect(component.form.invalid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('form is invalid when name is empty/null regardless of other fields', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        emptyOrNull,
        positiveNumber,
        (validSku, invalidName, validPrice) => {
          const { component } = createComponent();

          component.form.patchValue({
            sku: validSku,
            name: invalidName,
            price: validPrice,
            description: '',
            category_id: null,
          });

          expect(component.form.invalid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('form is invalid when price is null', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        nonEmptyString,
        (validSku, validName) => {
          const { component } = createComponent();

          component.form.patchValue({
            sku: validSku,
            name: validName,
            price: null,
            description: '',
            category_id: null,
          });

          expect(component.form.invalid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 10b: onSubmit() does not dispatch HTTP calls when form is invalid
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 3.7
 */
describe('ProductFormComponent — Property 10b: onSubmit() does not call create/update when form is invalid', () => {
  beforeEach(() => {
    mockInject.mockReset();
  });

  it('neither create nor update is called when sku is missing', () => {
    fc.assert(
      fc.property(
        emptyOrNull,
        nonEmptyString,
        positiveNumber,
        (invalidSku, validName, validPrice) => {
          const { component, mockProductService } = createComponent();

          component.form.patchValue({
            sku: invalidSku,
            name: validName,
            price: validPrice,
            description: '',
            category_id: null,
          });

          component.onSubmit();

          expect(mockProductService.create).not.toHaveBeenCalled();
          expect(mockProductService.update).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('neither create nor update is called when name is missing', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        emptyOrNull,
        positiveNumber,
        (validSku, invalidName, validPrice) => {
          const { component, mockProductService } = createComponent();

          component.form.patchValue({
            sku: validSku,
            name: invalidName,
            price: validPrice,
            description: '',
            category_id: null,
          });

          component.onSubmit();

          expect(mockProductService.create).not.toHaveBeenCalled();
          expect(mockProductService.update).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('neither create nor update is called when price is null', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        nonEmptyString,
        (validSku, validName) => {
          const { component, mockProductService } = createComponent();

          component.form.patchValue({
            sku: validSku,
            name: validName,
            price: null,
            description: '',
            category_id: null,
          });

          component.onSubmit();

          expect(mockProductService.create).not.toHaveBeenCalled();
          expect(mockProductService.update).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('neither create nor update is called when multiple required fields are missing', () => {
    fc.assert(
      fc.property(
        emptyOrNull,
        emptyOrNull,
        (invalidSku, invalidName) => {
          const { component, mockProductService } = createComponent();

          component.form.patchValue({
            sku: invalidSku,
            name: invalidName,
            price: null,
            description: '',
            category_id: null,
          });

          component.onSubmit();

          expect(mockProductService.create).not.toHaveBeenCalled();
          expect(mockProductService.update).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 10c: Form is valid and create is called when all required fields filled
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 3.7
 */
describe('ProductFormComponent — Property 10c: Form valid and create called when all required fields filled', () => {
  beforeEach(() => {
    mockInject.mockReset();
  });

  it('form is valid and productService.create() is called exactly once in create mode', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        nonEmptyString,
        positiveNumber,
        (validSku, validName, validPrice) => {
          const { component, mockProductService } = createComponent();

          component.form.patchValue({
            sku: validSku,
            name: validName,
            price: validPrice,
            description: '',
            category_id: null,
          });

          expect(component.form.valid).toBe(true);

          component.onSubmit();

          expect(mockProductService.create).toHaveBeenCalledTimes(1);
          expect(mockProductService.update).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// Property 11: CRUD forms dispatch correct HTTP method and URL
// Feature: pos-frontend, Property 11: CRUD forms dispatch correct HTTP method and URL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 3.2, 3.3
 *
 * - Req 3.2: submitting a *create* form → productService.create() (POST /api/v1/products)
 * - Req 3.3: submitting an *edit* form  → productService.update(id, ...) (PUT /api/v1/products/{id})
 */

// ── Arbitraries for valid product data ───────────────────────────────────────

/** Non-empty string that passes Validators.required */
const validString = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

/** Positive price that passes Validators.required + Validators.min(0) */
const validPrice = fc.float({
  min: Math.fround(0.01),
  max: Math.fround(9999.99),
  noNaN: true,
  noDefaultInfinity: true,
});

/** Positive integer product ID ≥ 1 */
const productIdArb = fc.integer({ min: 1, max: 999999 });

/** Complete valid product form data */
const validProductArb = fc.record({
  sku: validString,
  name: validString,
  price: validPrice,
});

// ── Helper: build mocks for CREATE mode (no :id param) ───────────────────────

function buildCreateModeMocks() {
  const fb = new FormBuilder();

  const mockProductService = {
    create: vi.fn().mockReturnValue(of(mockProduct)),
    update: vi.fn().mockReturnValue(of(mockProduct)),
    getById: vi.fn().mockReturnValue(of(mockProduct)),
  };

  const mockCategoryService = { getAll: vi.fn().mockReturnValue(of([])) };
  const mockRoute = { snapshot: { paramMap: { get: (_: string) => null } } };
  const mockRouter = { navigate: vi.fn() };

  mockInject.mockImplementation((token: unknown) => {
    if (token === FormBuilder) return fb;
    if ((token as { name?: string })?.name === 'ProductService') return mockProductService;
    if ((token as { name?: string })?.name === 'CategoryService') return mockCategoryService;
    if ((token as { name?: string })?.name === 'ActivatedRoute') return mockRoute;
    if ((token as { name?: string })?.name === 'Router') return mockRouter;
    return undefined;
  });

  const component = new ProductFormComponent();
  component.ngOnInit();
  return { component, mockProductService, mockRouter };
}

// ── Helper: build mocks for EDIT mode (route has :id param) ──────────────────

function buildEditModeMocks(id: number) {
  const fb = new FormBuilder();

  const mockProductService = {
    create: vi.fn().mockReturnValue(of(mockProduct)),
    update: vi.fn().mockReturnValue(of(mockProduct)),
    getById: vi.fn().mockReturnValue(of(mockProduct)),
  };

  const mockCategoryService = { getAll: vi.fn().mockReturnValue(of([])) };
  const mockRoute = { snapshot: { paramMap: { get: (_: string) => String(id) } } };
  const mockRouter = { navigate: vi.fn() };

  mockInject.mockImplementation((token: unknown) => {
    if (token === FormBuilder) return fb;
    if ((token as { name?: string })?.name === 'ProductService') return mockProductService;
    if ((token as { name?: string })?.name === 'CategoryService') return mockCategoryService;
    if ((token as { name?: string })?.name === 'ActivatedRoute') return mockRoute;
    if ((token as { name?: string })?.name === 'Router') return mockRouter;
    return undefined;
  });

  const component = new ProductFormComponent();
  component.ngOnInit();
  return { component, mockProductService, mockRouter };
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 11a: Create mode → calls productService.create() (POST /api/v1/products)
// ─────────────────────────────────────────────────────────────────────────────

describe('ProductFormComponent — Property 11a: Create mode dispatches POST to /api/v1/products', () => {
  beforeEach(() => {
    mockInject.mockReset();
  });

  it('productService.create() is called exactly once with form payload when in create mode', () => {
    fc.assert(
      fc.property(
        validProductArb,
        ({ sku, name, price }) => {
          const { component, mockProductService } = buildCreateModeMocks();

          component.form.patchValue({
            sku,
            name,
            price,
            description: '',
            category_id: null,
          });

          expect(component.form.valid).toBe(true);
          expect(component.isEditMode()).toBe(false);

          component.onSubmit();

          // Must call create (POST), never update (PUT)
          expect(mockProductService.create).toHaveBeenCalledTimes(1);
          expect(mockProductService.update).not.toHaveBeenCalled();

          // create() must receive the trimmed payload values
          const [payload] = mockProductService.create.mock.calls[0];
          expect(payload.sku).toBe(sku.trim());
          expect(payload.name).toBe(name.trim());
          expect(payload.selling_price).toBe(price);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 11b: Edit mode → calls productService.update(id, ...) (PUT /api/v1/products/{id})
// ─────────────────────────────────────────────────────────────────────────────

describe('ProductFormComponent — Property 11b: Edit mode dispatches PUT to /api/v1/products/{id}', () => {
  beforeEach(() => {
    mockInject.mockReset();
  });

  it('productService.update(id, payload) is called exactly once with the correct id and payload', () => {
    fc.assert(
      fc.property(
        productIdArb,
        validProductArb,
        (id, { sku, name, price }) => {
          const { component, mockProductService } = buildEditModeMocks(id);

          component.form.patchValue({
            sku,
            name,
            price,
            description: '',
            category_id: null,
          });

          expect(component.form.valid).toBe(true);
          expect(component.isEditMode()).toBe(true);

          component.onSubmit();

          // Must call update (PUT), never create (POST)
          expect(mockProductService.update).toHaveBeenCalledTimes(1);
          expect(mockProductService.create).not.toHaveBeenCalled();

          // update() must receive the correct id and trimmed payload values
          const [calledId, payload] = mockProductService.update.mock.calls[0];
          expect(calledId).toBe(id);
          expect(payload.sku).toBe(sku.trim());
          expect(payload.name).toBe(name.trim());
          expect(payload.selling_price).toBe(price);
        }
      ),
      { numRuns: 100 }
    );
  });
});

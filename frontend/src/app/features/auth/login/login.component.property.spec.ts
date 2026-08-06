// Feature: pos-frontend, Property 4: Invalid credentials show safe error message

import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';

// Mock Angular's inject() so we can test without a full Angular TestBed setup.
const { mockInject } = vi.hoisted(() => ({ mockInject: vi.fn() }));

vi.mock('@angular/core', async () => {
  const actual = await vi.importActual<typeof import('@angular/core')>('@angular/core');
  return { ...actual, inject: mockInject };
});

import { inject } from '@angular/core';
import { LoginComponent } from './login.component';

// Validates: Requirements 1.3

/**
 * Patterns that must NOT appear in a safe error message.
 * These represent stack traces, SQL keywords, and internal server details.
 */
const UNSAFE_PATTERNS = [
  // Stack trace indicators
  /at Object\./i,
  /at Function\./i,
  /Error:/i,
  /\bstack\b/i,
  // SQL keywords
  /\bSELECT\b/i,
  /\bINSERT\b/i,
  /\bFROM\b/i,
  /\bWHERE\b/i,
  /\bDROP\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  // Internal server / file path details
  /\/usr\//,
  /node_modules/,
  /\.js:\d+:\d+/,
  /\bsyntaxError\b/i,
];

/**
 * Arbitrary that generates realistic "dangerous" error response bodies —
 * the kind of internal details that must never be shown to the user.
 */
const dangerousErrorBodyArb = fc.oneof(
  // Stack trace style
  fc.string({ minLength: 1, maxLength: 200 }).map(
    (s) => `Error: ${s}\n    at Object.login (/usr/app/node_modules/auth/index.js:42:10)\n    at Function.handle`
  ),
  // SQL error style
  fc.string({ minLength: 1, maxLength: 100 }).map(
    (s) => `SELECT * FROM users WHERE username='${s}' -- SQL error near syntax`
  ),
  // Internal JSON with file paths
  fc.record({
    message: fc.string({ minLength: 1, maxLength: 50 }),
    stack: fc.string({ minLength: 1, maxLength: 100 }),
    file: fc.constant('/usr/app/src/auth/handler.ts'),
  }).map((obj) => JSON.stringify(obj)),
  // Generic internal error with node_modules path
  fc.string({ minLength: 1, maxLength: 50 }).map(
    (s) => `Internal error at node_modules/express/lib/router/index.js: ${s}`
  ),
  // Plain dangerous string
  fc.constantFrom(
    'Error: ECONNREFUSED 127.0.0.1:5432',
    'SELECT id FROM users WHERE password = md5($1)',
    'at Object.query (/usr/local/lib/node_modules/pg/lib/client.js:54:17)',
    'INSERT INTO audit_log VALUES (NOW(), $1, $2)',
    'stack: Error\n    at Function.Module._resolveFilename (node_modules/module.js:547:15)',
  )
);

/**
 * Arbitrary that generates non-2xx HTTP status codes (4xx and 5xx).
 */
const errorStatusArb = fc.oneof(
  fc.integer({ min: 400, max: 499 }),
  fc.integer({ min: 500, max: 599 })
);

/**
 * Build a mock AuthService that throws an HttpErrorResponse with the given
 * status and error body when login() is called.
 */
function makeAuthService(status: number, errorBody: unknown) {
  return {
    login: vi.fn(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status,
            error: errorBody,
            url: 'http://localhost:8080/api/v1/auth/login',
          })
      )
    ),
  };
}

/**
 * Build a mock Router.
 */
function makeRouter() {
  return { navigate: vi.fn() };
}

/**
 * Build a mock FormBuilder that returns a real-ish form group.
 * We use the actual Angular FormBuilder to keep the component logic intact.
 */
function makeFormBuilder() {
  return new FormBuilder();
}

/**
 * Instantiate LoginComponent by providing mocked dependencies via inject().
 */
function buildComponent(authService: ReturnType<typeof makeAuthService>, router: ReturnType<typeof makeRouter>) {
  // inject() is called in this order inside LoginComponent:
  //   1. FormBuilder
  //   2. AuthService
  //   3. Router
  mockInject
    .mockReturnValueOnce(makeFormBuilder() as any)
    .mockReturnValueOnce(authService as any)
    .mockReturnValueOnce(router as any);

  return new LoginComponent();
}

// ---------------------------------------------------------------------------
// Property 4: Invalid credentials show safe error message
// ---------------------------------------------------------------------------

describe('LoginComponent — Property 4: Invalid credentials show safe error message', () => {
  beforeEach(() => {
    mockInject.mockReset();
  });

  it('Property 4a: error message is non-empty for any non-2xx API response', () => {
    // Feature: pos-frontend, Property 4: Invalid credentials show safe error message
    fc.assert(
      fc.property(
        errorStatusArb,
        dangerousErrorBodyArb,
        (status, errorBody) => {
          const authService = makeAuthService(status, errorBody);
          const router = makeRouter();
          const component = buildComponent(authService, router);

          // Set valid form values so the form passes validation
          component.loginForm.setValue({ username: 'testuser', password: 'testpass' });

          // Trigger submit
          component.onSubmit();

          // The error message signal must be non-null and non-empty
          const msg = component.errorMessage();
          expect(msg).not.toBeNull();
          expect(typeof msg).toBe('string');
          expect((msg as string).trim().length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4b: error message does not contain stack traces, SQL, or internal server details', () => {
    // Feature: pos-frontend, Property 4: Invalid credentials show safe error message
    fc.assert(
      fc.property(
        errorStatusArb,
        dangerousErrorBodyArb,
        (status, errorBody) => {
          const authService = makeAuthService(status, errorBody);
          const router = makeRouter();
          const component = buildComponent(authService, router);

          // Set valid form values so the form passes validation
          component.loginForm.setValue({ username: 'testuser', password: 'testpass' });

          // Trigger submit
          component.onSubmit();

          const msg = component.errorMessage() ?? '';

          // Verify none of the unsafe patterns appear in the displayed message
          for (const pattern of UNSAFE_PATTERNS) {
            expect(
              pattern.test(msg),
              `Error message "${msg}" matched unsafe pattern ${pattern}`
            ).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4c: error message does not expose raw error body content from the API response', () => {
    // Feature: pos-frontend, Property 4: Invalid credentials show safe error message
    fc.assert(
      fc.property(
        errorStatusArb,
        // Generate error bodies that contain internal details
        fc.record({
          internalField: fc.string({ minLength: 5, maxLength: 30 }),
          dbQuery: fc.string({ minLength: 5, maxLength: 30 }).map(s => `SELECT * FROM ${s}`),
          stackTrace: fc.string({ minLength: 5, maxLength: 30 }).map(s => `at Object.${s}`),
        }),
        (status, errorBody) => {
          const authService = makeAuthService(status, errorBody);
          const router = makeRouter();
          const component = buildComponent(authService, router);

          component.loginForm.setValue({ username: 'user', password: 'pass' });
          component.onSubmit();

          const msg = component.errorMessage() ?? '';

          // The raw internal field value must not appear verbatim in the message
          expect(msg).not.toContain(errorBody.dbQuery);
          expect(msg).not.toContain(errorBody.stackTrace);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4d: loading state is reset to false after any error response', () => {
    // Feature: pos-frontend, Property 4: Invalid credentials show safe error message
    fc.assert(
      fc.property(
        errorStatusArb,
        dangerousErrorBodyArb,
        (status, errorBody) => {
          const authService = makeAuthService(status, errorBody);
          const router = makeRouter();
          const component = buildComponent(authService, router);

          component.loginForm.setValue({ username: 'testuser', password: 'testpass' });
          component.onSubmit();

          // Loading must be false after error — component must not be stuck in loading state
          expect(component.loading()).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

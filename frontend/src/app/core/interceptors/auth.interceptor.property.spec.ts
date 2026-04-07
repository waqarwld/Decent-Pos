// Feature: pos-frontend, Property 2: JWT attached to all /api/v1/* requests
// Feature: pos-frontend, Property 3: 401 response clears token and redirects to login

import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { of, throwError } from 'rxjs';
import { HttpRequest, HttpResponse, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';

// We test the interceptor logic directly by mocking Angular's inject()
// so we can run these tests without a full Angular TestBed setup.

vi.mock('@angular/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@angular/core')>();
  return { ...actual, inject: vi.fn() };
});

import { inject } from '@angular/core';
import { authInterceptor } from './auth.interceptor';

// Validates: Requirements 1.7

describe('AuthInterceptor — Property 2: JWT attached to all /api/v1/* requests', () => {
  const mockLogout = vi.fn();

  function makeAuthService(token: string | null) {
    return { getToken: () => token, logout: mockLogout };
  }

  function makeHandler(capturedReq: { value: HttpRequest<unknown> | null }): HttpHandlerFn {
    return (req) => {
      capturedReq.value = req;
      return of(new HttpResponse({ status: 200 }));
    };
  }

  beforeEach(() => {
    vi.mocked(inject).mockReset();
    mockLogout.mockReset();
  });

  it('Property 2a: attaches Authorization: Bearer header to every /api/v1/* request when token is present', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 64 }),
        (suffix, token) => {
          const url = `http://localhost:8080/api/v1/${suffix}`;
          vi.mocked(inject).mockReturnValue(makeAuthService(token) as any);

          const captured: { value: HttpRequest<unknown> | null } = { value: null };
          const req = new HttpRequest('GET', url);

          authInterceptor(req, makeHandler(captured));

          const outgoing = captured.value!;
          expect(outgoing).not.toBeNull();
          expect(outgoing.headers.get('Authorization')).toBe(`Bearer ${token}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2b: does NOT attach Authorization header to requests that do not match /api/v1/*', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('http://localhost:8080/health'),
          fc.constant('http://localhost:8080/'),
          fc.constant('http://localhost:8080/api/v2/products'),
          fc.constant('http://localhost:8080/other/endpoint'),
          fc.string({ minLength: 1, maxLength: 30 }).map(s => `http://localhost/${s.replace(/\//g, '-')}`)
        ),
        fc.string({ minLength: 1, maxLength: 64 }),
        (url, token) => {
          fc.pre(!url.includes('/api/v1/'));

          vi.mocked(inject).mockReturnValue(makeAuthService(token) as any);

          const captured: { value: HttpRequest<unknown> | null } = { value: null };
          const req = new HttpRequest('GET', url);

          authInterceptor(req, makeHandler(captured));

          const outgoing = captured.value!;
          expect(outgoing).not.toBeNull();
          expect(outgoing.headers.get('Authorization')).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2c: does NOT attach Authorization header when token is null, even for /api/v1/* requests', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }),
        (suffix) => {
          const url = `http://localhost:8080/api/v1/${suffix}`;
          vi.mocked(inject).mockReturnValue(makeAuthService(null) as any);

          const captured: { value: HttpRequest<unknown> | null } = { value: null };
          const req = new HttpRequest('GET', url);

          authInterceptor(req, makeHandler(captured));

          const outgoing = captured.value!;
          expect(outgoing).not.toBeNull();
          expect(outgoing.headers.get('Authorization')).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Validates: Requirements 1.5

describe('AuthInterceptor — Property 3: 401 response clears token and redirects to login', () => {
  const mockLogout = vi.fn();
  const mockNavigate = vi.fn();

  function makeAuthService(token: string | null) {
    return { getToken: () => token, logout: mockLogout };
  }

  /** Handler that always responds with the given HTTP status */
  function makeErrorHandler(status: number): HttpHandlerFn {
    return (_req) =>
      throwError(
        () =>
          new HttpErrorResponse({
            status,
            url: _req.url,
            error: 'error',
          })
      );
  }

  /** Handler that always responds with 200 */
  function makeSuccessHandler(): HttpHandlerFn {
    return (_req) => of(new HttpResponse({ status: 200 }));
  }

  beforeEach(() => {
    vi.mocked(inject).mockReset();
    mockLogout.mockReset();
    mockNavigate.mockReset();
  });

  it('Property 3a: logout() is called exactly once for every 401 response, regardless of URL or token', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 80 }).map((s) => `http://localhost/${s.replace(/\s/g, '-')}`),
        fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: null }),
        (url, token) => {
          vi.mocked(inject).mockReturnValue(makeAuthService(token) as any);
          mockLogout.mockReset();

          const req = new HttpRequest('GET', url);
          let caughtError: unknown;

          authInterceptor(req, makeErrorHandler(401)).subscribe({
            error: (e) => { caughtError = e; },
          });

          // logout must have been called exactly once
          expect(mockLogout).toHaveBeenCalledTimes(1);
          // error must still propagate to the caller
          expect(caughtError).toBeInstanceOf(HttpErrorResponse);
          expect((caughtError as HttpErrorResponse).status).toBe(401);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3b: logout() is NOT called for non-401 error responses', () => {
    fc.assert(
      fc.property(
        // Any HTTP error status except 401
        fc.integer({ min: 400, max: 599 }).filter((s) => s !== 401),
        fc.string({ minLength: 1, maxLength: 80 }).map((s) => `http://localhost/${s.replace(/\s/g, '-')}`),
        fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: null }),
        (status, url, token) => {
          vi.mocked(inject).mockReturnValue(makeAuthService(token) as any);
          mockLogout.mockReset();

          const req = new HttpRequest('GET', url);

          authInterceptor(req, makeErrorHandler(status)).subscribe({
            error: () => { /* expected */ },
          });

          expect(mockLogout).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3c: logout() is NOT called for successful (2xx) responses', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 80 }).map((s) => `http://localhost/${s.replace(/\s/g, '-')}`),
        fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: null }),
        (url, token) => {
          vi.mocked(inject).mockReturnValue(makeAuthService(token) as any);
          mockLogout.mockReset();

          const req = new HttpRequest('GET', url);

          authInterceptor(req, makeSuccessHandler()).subscribe();

          expect(mockLogout).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

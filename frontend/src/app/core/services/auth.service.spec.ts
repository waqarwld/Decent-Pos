import '@angular/compiler';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';

// Mock Angular's inject() so we can test without a full TestBed
const { mockInject } = vi.hoisted(() => ({ mockInject: vi.fn() }));

vi.mock('@angular/core', async () => {
  const actual = await vi.importActual<typeof import('@angular/core')>('@angular/core');
  return { ...actual, inject: mockInject };
});

import { inject } from '@angular/core';
import { AuthService } from './auth.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHttpClient(response: unknown, shouldError = false) {
  return {
    post: vi.fn(() => (shouldError ? throwError(() => response) : of(response))),
  };
}

function makeRouter() {
  return { navigate: vi.fn() };
}

function buildService(httpClient: ReturnType<typeof makeHttpClient>, router: ReturnType<typeof makeRouter>) {
  // inject() is called twice inside AuthService constructor: http then router
  mockInject
    .mockReturnValueOnce(httpClient as any)
    .mockReturnValueOnce(router as any);
  return new AuthService();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockInject.mockReset();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // -------------------------------------------------------------------------
  // login()
  // -------------------------------------------------------------------------

  describe('login()', () => {
    it('stores the token in sessionStorage on success', () => {
      const token = 'test-jwt-token-abc123';
      const http = makeHttpClient({ token });
      const router = makeRouter();
      const service = buildService(http, router);

      service.login({ username: 'user', password: 'pass' }).subscribe();

      expect(sessionStorage.getItem('auth_token')).toBe(token);
    });

    it('sets isAuthenticated to true after a successful login', () => {
      const token = 'another-token';
      const http = makeHttpClient({ token });
      const router = makeRouter();
      const service = buildService(http, router);

      expect(service.isAuthenticated()).toBe(false);

      service.login({ username: 'user', password: 'pass' }).subscribe();

      expect(service.isAuthenticated()).toBe(true);
    });

    it('makes getToken() return the received token', () => {
      const token = 'my-token-xyz';
      const http = makeHttpClient({ token });
      const router = makeRouter();
      const service = buildService(http, router);

      service.login({ username: 'user', password: 'pass' }).subscribe();

      expect(service.getToken()).toBe(token);
    });

    it('does not store a token when the API returns an error', () => {
      const http = makeHttpClient({ error: 'Unauthorized' }, true);
      const router = makeRouter();
      const service = buildService(http, router);

      service.login({ username: 'bad', password: 'creds' }).subscribe({
        error: () => { /* expected */ },
      });

      expect(sessionStorage.getItem('auth_token')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // logout()
  // -------------------------------------------------------------------------

  describe('logout()', () => {
    it('clears the token from sessionStorage', () => {
      sessionStorage.setItem('auth_token', 'some-token');
      const http = makeHttpClient({});
      const router = makeRouter();
      const service = buildService(http, router);
      // Manually prime the signal as if a session was active
      service.restoreSession();

      service.logout();

      expect(sessionStorage.getItem('auth_token')).toBeNull();
    });

    it('sets isAuthenticated to false after logout', () => {
      const token = 'active-token';
      const http = makeHttpClient({ token });
      const router = makeRouter();
      const service = buildService(http, router);

      service.login({ username: 'user', password: 'pass' }).subscribe();
      expect(service.isAuthenticated()).toBe(true);

      service.logout();

      expect(service.isAuthenticated()).toBe(false);
    });

    it('navigates to /login after logout', () => {
      const http = makeHttpClient({});
      const router = makeRouter();
      const service = buildService(http, router);

      service.logout();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('makes getToken() return null after logout', () => {
      const token = 'token-to-clear';
      const http = makeHttpClient({ token });
      const router = makeRouter();
      const service = buildService(http, router);

      service.login({ username: 'user', password: 'pass' }).subscribe();
      expect(service.getToken()).toBe(token);

      service.logout();

      expect(service.getToken()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // restoreSession()
  // -------------------------------------------------------------------------

  describe('restoreSession()', () => {
    it('rehydrates isAuthenticated from a token in sessionStorage', () => {
      sessionStorage.setItem('auth_token', 'persisted-token');
      const http = makeHttpClient({});
      const router = makeRouter();
      const service = buildService(http, router);

      expect(service.isAuthenticated()).toBe(false);

      service.restoreSession();

      expect(service.isAuthenticated()).toBe(true);
    });

    it('makes getToken() return the persisted token', () => {
      const token = 'persisted-jwt';
      sessionStorage.setItem('auth_token', token);
      const http = makeHttpClient({});
      const router = makeRouter();
      const service = buildService(http, router);

      service.restoreSession();

      expect(service.getToken()).toBe(token);
    });

    it('leaves isAuthenticated false when sessionStorage has no token', () => {
      const http = makeHttpClient({});
      const router = makeRouter();
      const service = buildService(http, router);

      service.restoreSession();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.getToken()).toBeNull();
    });

    it('does not navigate when restoring a valid session', () => {
      sessionStorage.setItem('auth_token', 'some-token');
      const http = makeHttpClient({});
      const router = makeRouter();
      const service = buildService(http, router);

      service.restoreSession();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});

import '@angular/compiler';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subject } from 'rxjs';

// Mock Angular's inject() so we can test without a full TestBed
const { mockInject } = vi.hoisted(() => ({ mockInject: vi.fn() }));

vi.mock('@angular/core', async () => {
  const actual = await vi.importActual<typeof import('@angular/core')>('@angular/core');
  return { ...actual, inject: mockInject };
});

import { inject } from '@angular/core';
import { ApiHealthService } from './api-health.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHttpClient(response: unknown, shouldError = false) {
  return {
    get: vi.fn(() => (shouldError ? throwError(() => response) : of(response))),
  };
}

function buildService(httpClient: ReturnType<typeof makeHttpClient>) {
  mockInject.mockReturnValueOnce(httpClient as any);
  return new ApiHealthService();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ApiHealthService', () => {
  beforeEach(() => {
    mockInject.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with isConnected false before the first poll completes', () => {
    // Use a never-resolving observable to simulate pending request
    const http = { get: vi.fn(() => new Subject().asObservable()) };
    mockInject.mockReturnValueOnce(http as any);
    const service = new ApiHealthService();

    // Before any response, isConnected should be false
    expect(service.isConnected()).toBe(false);

    service.ngOnDestroy();
  });

  it('sets isConnected to true when GET /health succeeds', () => {
    const http = makeHttpClient('OK');
    const service = buildService(http);

    // startWith(0) triggers immediately — no need to advance timers
    expect(service.isConnected()).toBe(true);

    service.ngOnDestroy();
  });

  it('sets isConnected to false when GET /health fails', () => {
    const http = makeHttpClient(new Error('Network error'), true);
    const service = buildService(http);

    expect(service.isConnected()).toBe(false);

    service.ngOnDestroy();
  });

  it('polls again after 30 seconds', () => {
    const http = makeHttpClient('OK');
    const service = buildService(http);

    const callCountAfterInit = http.get.mock.calls.length;
    expect(callCountAfterInit).toBe(1);

    vi.advanceTimersByTime(30_000);

    expect(http.get.mock.calls.length).toBe(2);

    service.ngOnDestroy();
  });

  it('updates isConnected to false after a previously successful poll fails', () => {
    let callCount = 0;
    const http = {
      get: vi.fn(() => {
        callCount++;
        if (callCount === 1) return of('OK');
        return throwError(() => new Error('down'));
      }),
    };
    mockInject.mockReturnValueOnce(http as any);
    const service = new ApiHealthService();

    expect(service.isConnected()).toBe(true);

    vi.advanceTimersByTime(30_000);

    expect(service.isConnected()).toBe(false);

    service.ngOnDestroy();
  });

  it('recovers isConnected to true after a failed poll succeeds', () => {
    let callCount = 0;
    const http = {
      get: vi.fn(() => {
        callCount++;
        if (callCount === 1) return throwError(() => new Error('down'));
        return of('OK');
      }),
    };
    mockInject.mockReturnValueOnce(http as any);
    const service = new ApiHealthService();

    expect(service.isConnected()).toBe(false);

    vi.advanceTimersByTime(30_000);

    expect(service.isConnected()).toBe(true);

    service.ngOnDestroy();
  });

  it('calls GET /health with the correct URL', () => {
    const http = makeHttpClient('OK');
    const service = buildService(http);

    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:8080/health',
      expect.objectContaining({ responseType: 'text' })
    );

    service.ngOnDestroy();
  });

  it('unsubscribes on destroy, stopping further polls', () => {
    const http = makeHttpClient('OK');
    const service = buildService(http);

    const callCountBeforeDestroy = http.get.mock.calls.length;
    service.ngOnDestroy();

    vi.advanceTimersByTime(60_000);

    expect(http.get.mock.calls.length).toBe(callCountBeforeDestroy);
  });
});

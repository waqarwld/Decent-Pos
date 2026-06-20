import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { catchError, of, startWith, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

const POLL_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class ApiHealthService implements OnDestroy {
  private readonly http = inject(HttpClient);

  private readonly _isConnected = signal<boolean>(false);

  /** True when the last GET /health request succeeded; false on error or before first response */
  readonly isConnected = this._isConnected.asReadonly();

  private readonly _subscription: Subscription;

  constructor() {
    this._subscription = interval(POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.http.get(`${environment.apiBaseUrl}/health`, { responseType: 'text' }).pipe(
            catchError(() => of(null))
          )
        )
      )
      .subscribe((response) => {
        this._isConnected.set(response !== null);
      });
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  InventoryMovement,
  ReceiveRequest,
  ShipRequest,
  TransferRequest,
  AdjustRequest,
} from '../models/inventory';
import { ApiError } from '../models/auth';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/inventory`;

  /**
   * Retrieve all inventory movements.
   * GET /api/v1/inventory/movements
   */
  getMovements(): Observable<InventoryMovement[]> {
    return this.http
      .get<InventoryMovement[]>(`${this.base}/movements`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Record a stock receipt from a supplier.
   * POST /api/v1/inventory/receive
   */
  receive(req: ReceiveRequest): Observable<InventoryMovement> {
    return this.http
      .post<InventoryMovement>(`${this.base}/receive`, req)
      .pipe(catchError(this.handleError));
  }

  /**
   * Record a stock shipment (outbound).
   * POST /api/v1/inventory/ship
   */
  ship(req: ShipRequest): Observable<InventoryMovement> {
    return this.http
      .post<InventoryMovement>(`${this.base}/ship`, req)
      .pipe(catchError(this.handleError));
  }

  /**
   * Transfer stock between locations.
   * POST /api/v1/inventory/transfer
   */
  transfer(req: TransferRequest): Observable<InventoryMovement> {
    return this.http
      .post<InventoryMovement>(`${this.base}/transfer`, req)
      .pipe(catchError(this.handleError));
  }

  /**
   * Apply a manual stock adjustment.
   * POST /api/v1/inventory/adjust
   */
  adjust(req: AdjustRequest): Observable<InventoryMovement> {
    return this.http
      .post<InventoryMovement>(`${this.base}/adjust`, req)
      .pipe(catchError(this.handleError));
  }

  /** Normalise HTTP errors; never expose raw objects to consumers */
  private handleError(err: { error?: ApiError; message?: string }): Observable<never> {
    const message =
      err?.error?.message ?? err?.error?.error ?? err?.message ?? 'An unexpected error occurred';
    return throwError(() => new Error(message));
  }
}

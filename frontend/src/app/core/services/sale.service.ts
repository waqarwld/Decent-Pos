import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/product';
import { ApiError } from '../models/auth';
import {
  CheckoutRequest,
  PurchaseHistory,
  ReturnRecord,
  ReturnRequest,
  Sale,
} from '../models/customer';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/sales`;

  /**
   * Complete a sale (checkout). POST /api/v1/sales
   * The backend charges wholesale vs retail price per customer type and
   * decrements stock atomically.
   */
  checkout(req: CheckoutRequest): Observable<Sale> {
    return this.http
      .post<Sale>(this.base, req)
      .pipe(catchError(this.handleError));
  }

  /**
   * List sales with optional pagination. GET /api/v1/sales
   */
  getAll(page = 1, pageSize = 50): Observable<Sale[]> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('page_size', String(pageSize));
    return this.http
      .get<PaginatedResponse<Sale>>(this.base, { params })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  /**
   * Fetch a customer's purchase history.
   * GET /api/v1/customers/{customerId}/purchases
   */
  getPurchases(customerId: number): Observable<PurchaseHistory> {
    return this.http
      .get<PurchaseHistory>(`${environment.apiBaseUrl}/api/v1/customers/${customerId}/purchases`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Record a return against a sale line. Restocks the item and records a refund.
   * POST /api/v1/sales/{saleId}/returns
   */
  createReturn(saleId: number, req: ReturnRequest): Observable<ReturnRecord> {
    return this.http
      .post<ReturnRecord>(`${this.base}/${saleId}/returns`, req)
      .pipe(catchError(this.handleError));
  }

  /** Normalise HTTP errors; never expose raw objects to consumers */
  private handleError(err: { error?: ApiError; message?: string }): Observable<never> {
    const message =
      err?.error?.message ?? err?.error?.error ?? err?.message ?? 'An unexpected error occurred';
    return throwError(() => new Error(message));
  }
}
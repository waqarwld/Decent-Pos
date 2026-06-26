import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/product';
import { InventoryMovement } from '../models/inventory';
import {
  ProductStockSummary,
  StockLevel,
  LowStockAlert,
  ValuationRecord,
  TurnoverItem,
  SupplierPerformance,
  AgingRecord,
} from '../models/reports';
import { ApiError } from '../models/auth';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/reports`;

  /**
   * Get stock summary report.
   * GET /api/v1/reports/stock/summary
   */
  getSummary(
    page?: number,
    pageSize?: number,
  ): Observable<PaginatedResponse<ProductStockSummary>> {
    let params = new HttpParams();
    if (page !== undefined) {
      params = params.set('page', String(page));
    }
    if (pageSize !== undefined) {
      params = params.set('page_size', String(pageSize));
    }
    return this.http
      .get<PaginatedResponse<ProductStockSummary>>(`${this.base}/stock/summary`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get stock levels report.
   * GET /api/v1/reports/stock
   */
  getStock(
    productId?: number,
    locationId?: number,
    page?: number,
    pageSize?: number,
  ): Observable<PaginatedResponse<StockLevel>> {
    let params = new HttpParams();
    if (productId !== undefined) {
      params = params.set('product_id', String(productId));
    }
    if (locationId !== undefined) {
      params = params.set('location_id', String(locationId));
    }
    if (page !== undefined) {
      params = params.set('page', String(page));
    }
    if (pageSize !== undefined) {
      params = params.set('page_size', String(pageSize));
    }
    return this.http
      .get<PaginatedResponse<StockLevel>>(`${this.base}/stock`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get low stock alerts report.
   * GET /api/v1/reports/stock/alerts
   */
  getAlerts(): Observable<LowStockAlert[]> {
    return this.http
      .get<LowStockAlert[]>(`${this.base}/stock/alerts`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get inventory valuation report.
   * GET /api/v1/reports/valuation
   */
  getValuation(
    method?: string,
    productId?: number,
    locationId?: number,
  ): Observable<ValuationRecord[]> {
    let params = new HttpParams();
    if (method !== undefined) {
      params = params.set('method', method);
    }
    if (productId !== undefined) {
      params = params.set('product_id', String(productId));
    }
    if (locationId !== undefined) {
      params = params.set('location_id', String(locationId));
    }
    return this.http
      .get<ValuationRecord[]>(`${this.base}/valuation`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get inventory turnover report.
   * GET /api/v1/reports/turnover
   */
  getTurnover(
    startDate?: string,
    endDate?: string,
    productId?: number,
    locationId?: number,
  ): Observable<TurnoverItem[]> {
    let params = new HttpParams();
    if (startDate !== undefined) {
      params = params.set('start_date', startDate);
    }
    if (endDate !== undefined) {
      params = params.set('end_date', endDate);
    }
    if (productId !== undefined) {
      params = params.set('product_id', String(productId));
    }
    if (locationId !== undefined) {
      params = params.set('location_id', String(locationId));
    }
    return this.http
      .get<TurnoverItem[]>(`${this.base}/turnover`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get supplier performance report.
   * GET /api/v1/reports/suppliers/performance
   */
  getSupplierPerformance(): Observable<SupplierPerformance[]> {
    return this.http
      .get<SupplierPerformance[]>(`${this.base}/suppliers/performance`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get recent inventory movements report.
   * GET /api/v1/reports/movements/recent
   */
  getRecentMovements(
    page?: number,
    pageSize?: number,
  ): Observable<PaginatedResponse<InventoryMovement>> {
    let params = new HttpParams();
    if (page !== undefined) {
      params = params.set('page', String(page));
    }
    if (pageSize !== undefined) {
      params = params.set('page_size', String(pageSize));
    }
    return this.http
      .get<PaginatedResponse<InventoryMovement>>(`${this.base}/movements/recent`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get stock aging report.
   * GET /api/v1/reports/stock/aging
   */
  getAging(): Observable<AgingRecord[]> {
    return this.http
      .get<AgingRecord[]>(`${this.base}/stock/aging`)
      .pipe(catchError(this.handleError));
  }

  /** Normalise HTTP errors; never expose raw objects to consumers */
  private handleError(
    err: HttpErrorResponse | { error?: ApiError; message?: string },
  ): Observable<never> {
    const httpErr = err as HttpErrorResponse;
    const message =
      httpErr?.error?.message ??
      httpErr?.error?.error ??
      (err as { message?: string })?.message ??
      'An unexpected error occurred';
    return throwError(() => new Error(message));
  }
}
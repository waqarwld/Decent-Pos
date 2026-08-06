import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Supplier, SupplierCreateRequest } from '../models/inventory';
import { PaginatedResponse } from '../models/product';
import { ApiError } from '../models/auth';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/suppliers`;

  /**
   * Retrieve all suppliers.
   * GET /api/v1/suppliers
   */
  getAll(): Observable<Supplier[]> {
    return this.http
      .get<PaginatedResponse<Supplier>>(this.base)
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  /**
   * Create a new supplier.
   * POST /api/v1/suppliers
   */
  create(req: SupplierCreateRequest): Observable<Supplier> {
    return this.http
      .post<Supplier>(this.base, req)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update an existing supplier by ID.
   * PUT /api/v1/suppliers/{id}
   */
  update(id: number, req: SupplierCreateRequest): Observable<Supplier> {
    return this.http
      .put<Supplier>(`${this.base}/${id}`, req)
      .pipe(catchError(this.handleError));
  }

  /** Normalise HTTP errors; never expose raw objects to consumers */
  private handleError(err: { error?: ApiError; message?: string }): Observable<never> {
    const message =
      err?.error?.message ?? err?.error?.error ?? err?.message ?? 'An unexpected error occurred';
    return throwError(() => new Error(message));
  }
}

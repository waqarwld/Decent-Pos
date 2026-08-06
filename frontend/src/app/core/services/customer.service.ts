import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/product';
import { ApiError } from '../models/auth';
import { Customer, CustomerRequest } from '../models/customer';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/customers`;

  /**
   * Retrieve all customers with optional pagination.
   * GET /api/v1/customers?page=..&page_size=..
   */
  getAll(page = 1, pageSize = 50): Observable<Customer[]> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('page_size', String(pageSize));
    return this.http
      .get<PaginatedResponse<Customer>>(this.base, { params })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  /**
   * Get a single customer by ID.
   * GET /api/v1/customers/{id}
   */
  getById(id: number): Observable<Customer> {
    return this.http
      .get<Customer>(`${this.base}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new customer.
   * POST /api/v1/customers
   */
  create(req: CustomerRequest): Observable<Customer> {
    return this.http
      .post<Customer>(this.base, req)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update an existing customer by ID.
   * PUT /api/v1/customers/{id}
   */
  update(id: number, req: CustomerRequest): Observable<Customer> {
    return this.http
      .put<Customer>(`${this.base}/${id}`, req)
      .pipe(catchError(this.handleError));
  }

  /** Normalise HTTP errors; never expose raw objects to consumers */
  private handleError(err: { error?: ApiError; message?: string }): Observable<never> {
    const message =
      err?.error?.message ?? err?.error?.error ?? err?.message ?? 'An unexpected error occurred';
    return throwError(() => new Error(message));
  }
}
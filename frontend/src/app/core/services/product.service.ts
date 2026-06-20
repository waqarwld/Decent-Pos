import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Product,
  ProductCreateRequest,
  ProductUpdateRequest,
  PaginatedResponse,
} from '../models/product';
import { ApiError } from '../models/auth';

/** Error subclass that carries the originating HTTP status code. */
export class HttpStatusError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'HttpStatusError';
  }
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/products`;

  /**
   * Search products by SKU or name fragment.
   * GET /api/v1/products?search=<query>
   */
  search(query: string): Observable<PaginatedResponse<Product>> {
    const params = new HttpParams().set('search', query);
    return this.http
      .get<PaginatedResponse<Product>>(this.base, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all products with optional pagination.
   * GET /api/v1/products?page=<page>&page_size=<pageSize>
   */
  getAll(page = 1, pageSize = 20): Observable<PaginatedResponse<Product>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('page_size', String(pageSize));
    return this.http
      .get<PaginatedResponse<Product>>(this.base, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Look up a single product by SKU.
   * GET /api/v1/products/sku/{sku}
   * Throws HttpStatusError with status=404 when the product does not exist.
   */
  getBySku(sku: string): Observable<Product> {
    return this.http
      .get<Product>(`${this.base}/sku/${encodeURIComponent(sku)}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get a single product by ID.
   * GET /api/v1/products/{id}
   */
  getById(id: number): Observable<Product> {
    return this.http
      .get<Product>(`${this.base}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new product.
   * POST /api/v1/products
   */
  create(req: ProductCreateRequest): Observable<Product> {
    return this.http
      .post<Product>(this.base, req)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update an existing product by ID.
   * PUT /api/v1/products/{id}
   */
  update(id: number, req: ProductUpdateRequest): Observable<Product> {
    return this.http
      .put<Product>(`${this.base}/${id}`, req)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete a product by ID.
   * DELETE /api/v1/products/{id}
   */
  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /** Normalise HTTP errors; never expose raw objects to consumers */
  private handleError(err: HttpErrorResponse | { error?: ApiError; message?: string }): Observable<never> {
    const status = err instanceof HttpErrorResponse ? err.status : 0;
    const httpErr = err as HttpErrorResponse;
    const message =
      httpErr?.error?.message ??
      httpErr?.error?.error ??
      (err as { message?: string })?.message ??
      'An unexpected error occurred';
    return throwError(() => new HttpStatusError(message, status));
  }
}

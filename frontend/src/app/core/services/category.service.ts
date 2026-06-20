import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CategoryCreateRequest } from '../models/product';
import { ApiError } from '../models/auth';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/categories`;

  /**
   * Retrieve all categories.
   * GET /api/v1/categories
   */
  getAll(): Observable<Category[]> {
    return this.http
      .get<Category[]>(this.base)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new category.
   * POST /api/v1/categories
   */
  create(req: CategoryCreateRequest): Observable<Category> {
    return this.http
      .post<Category>(this.base, req)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update an existing category by ID.
   * PUT /api/v1/categories/{id}
   */
  update(id: number, req: CategoryCreateRequest): Observable<Category> {
    return this.http
      .put<Category>(`${this.base}/${id}`, req)
      .pipe(catchError(this.handleError));
  }

  /** Normalise HTTP errors; never expose raw objects to consumers */
  private handleError(err: { error?: ApiError; message?: string }): Observable<never> {
    const message =
      err?.error?.message ?? err?.error?.error ?? err?.message ?? 'An unexpected error occurred';
    return throwError(() => new Error(message));
  }
}

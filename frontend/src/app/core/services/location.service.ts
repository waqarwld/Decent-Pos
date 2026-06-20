import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Location, LocationCreateRequest } from '../models/inventory';
import { PaginatedResponse } from '../models/product';
import { ApiError } from '../models/auth';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/locations`;

  /**
   * Retrieve all locations.
   * GET /api/v1/locations
   */
  getAll(): Observable<Location[]> {
    return this.http
      .get<PaginatedResponse<Location>>(this.base)
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  /**
   * Create a new location.
   * POST /api/v1/locations
   */
  create(req: LocationCreateRequest): Observable<Location> {
    return this.http
      .post<Location>(this.base, req)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update an existing location by ID.
   * PUT /api/v1/locations/{id}
   */
  update(id: number, req: LocationCreateRequest): Observable<Location> {
    return this.http
      .put<Location>(`${this.base}/${id}`, req)
      .pipe(catchError(this.handleError));
  }

  /** Normalise HTTP errors; never expose raw objects to consumers */
  private handleError(err: { error?: ApiError; message?: string }): Observable<never> {
    const message =
      err?.error?.message ?? err?.error?.error ?? err?.message ?? 'An unexpected error occurred';
    return throwError(() => new Error(message));
  }
}

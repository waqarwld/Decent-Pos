import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth';

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(null);

  /** Computed boolean signal — true when a token is present */
  readonly isAuthenticated = computed(() => this._token() !== null);

  /** POST /api/v1/auth/login — stores token in sessionStorage on success */
  login(req: LoginRequest) {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/api/v1/auth/login`, req)
      .pipe(
        tap((res: LoginResponse) => {
          sessionStorage.setItem(TOKEN_KEY, res.token);
          this._token.set(res.token);
        })
      );
  }

  /** Clears sessionStorage and navigates to /login */
  logout(): void {
    sessionStorage.clear();
    this._token.set(null);
    this.router.navigate(['/login']);
  }

  /** Reads token from sessionStorage and updates the internal signal */
  restoreSession(): void {
    const token = sessionStorage.getItem(TOKEN_KEY);
    this._token.set(token);
  }

  /** Returns the current token string or null */
  getToken(): string | null {
    return this._token();
  }
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, of, Observable } from 'rxjs';
import { AuthService as ApiAuthService } from '../../../../../src/openapi/generated/services/auth.service';
import { ApiService } from '../../../../../src/openapi/generated/services/api.service';
import { LoginRequest, TokenResponse } from '../../../../../src/openapi/generated/models';

export interface Me {
  id: string;
  role: 'superadmin' | 'manager' | 'professional';
}

export interface AuthState {
  user: Me | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiAuth = inject(ApiAuthService);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  // Signals para el estado de autenticación
  private readonly _authState = signal<AuthState>({
    user: null,
    token: this.getStoredToken(),
    isAuthenticated: false,
    isLoading: false,
    error: null
  });

  // Computed signals
  readonly authState = this._authState.asReadonly();
  readonly user = computed(() => this._authState().user);
  readonly token = computed(() => this._authState().token);
  readonly isAuthenticated = computed(() => this._authState().isAuthenticated);
  readonly isLoading = computed(() => this._authState().isLoading);
  readonly error = computed(() => this._authState().error);
  readonly userRole = computed(() => this._authState().user?.role);
  readonly isSuperAdmin = computed(() => this.userRole() === 'superadmin');
  readonly isManager = computed(() => this.userRole() === 'manager');
  readonly isProfessional = computed(() => this.userRole() === 'professional');

  constructor() {
    // Verificar token al inicializar
    const token = this.getStoredToken();
    if (token) {
      this.validateToken();
    }
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    this.setLoading(true);
    this.clearError();

    return this.apiAuth.loginAuthLoginPost({ body: credentials }).pipe(
      tap((response) => {
        this.setToken(response.access_token);
        this.loadUserProfile();
      }),
      catchError(() => {
        this.setError('Credenciales inválidas');
        this.setLoading(false);
        return of();
      })
    );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._authState().token;
  }

  private loadUserProfile(): void {
    this.apiService
      .meAuthMeGet()
      .pipe(
        tap((user: unknown) => {
          this._authState.update((state) => ({
            ...state,
            user: user as Me,
            isAuthenticated: true,
            isLoading: false
          }));
        }),
        catchError(() => {
          this.clearAuth();
          return of();
        })
      )
      .subscribe();
  }

  private validateToken(): void {
    this.setLoading(true);
    this.loadUserProfile();
  }

  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this._authState.update((state) => ({
      ...state,
      token
    }));
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private clearAuth(): void {
    localStorage.removeItem('auth_token');
    this._authState.set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  }

  private setLoading(isLoading: boolean): void {
    this._authState.update((state) => ({ ...state, isLoading }));
  }

  private setError(error: string): void {
    this._authState.update((state) => ({ ...state, error, isLoading: false }));
  }

  private clearError(): void {
    this._authState.update((state) => ({ ...state, error: null }));
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  setRedirectUrl(url: string): void {
    localStorage.setItem('redirect_url', url);
  }

  getRedirectUrl(): string | null {
    const url = localStorage.getItem('redirect_url');
    localStorage.removeItem('redirect_url');
    return url;
  }
}

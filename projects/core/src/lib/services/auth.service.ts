import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, of, Observable } from 'rxjs';
import { AuthService as ApiAuthService } from '../../../../../src/openapi/generated/services/auth.service';
import { ApiService } from '../../../../../src/openapi/generated/services/api.service';
import { LoginRequest, TokenResponse } from '../../../../../src/openapi/generated/models';
import { StorageService } from './storage.service';

export interface Me {
  id: string;
  role: 'superadmin' | 'manager' | 'professional';
}

export interface AuthState {
  user: Me | null;
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
  private readonly storageService = inject(StorageService);

  // Signals para el estado de autenticación
  private readonly _authState = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  });

  // Computed signals
  readonly authState = this._authState.asReadonly();
  readonly user = computed(() => this._authState().user);
  readonly token = computed(() => this.storageService.token());
  readonly isAuthenticated = computed(() => {
    // Si el StorageService dice que está autenticado, pero nuestro estado interno no lo está,
    // devolvemos true del StorageService para persistencia entre recargas
    const storageAuth = this.storageService.isAuthenticated();
    const internalAuth = this._authState().isAuthenticated;

    if (storageAuth && !internalAuth) {
      // El StorageService tiene autenticación pero nuestro estado interno no,
      // forzamos la recarga del perfil
      this.loadUserProfile();
    }

    return storageAuth || internalAuth;
  });
  readonly isLoading = computed(() => this._authState().isLoading);
  readonly error = computed(() => this._authState().error);
  readonly userRole = computed(() => this._authState().user?.role);
  readonly isSuperAdmin = computed(() => this.userRole() === 'superadmin');
  readonly isManager = computed(() => this.userRole() === 'manager');
  readonly isProfessional = computed(() => this.userRole() === 'professional');

  constructor() {
    // Verificar token al inicializar
    const token = this.storageService.token();
    if (token) {
      this.validateToken();
    }
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    this.setLoading(true);
    this.clearError();

    return this.apiAuth.loginAuthLoginPost({ body: credentials }).pipe(
      tap((response) => {
        this.storageService.setToken(response.access_token);
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
    this.storageService.clearAll();
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.storageService.token();
  }

  private loadUserProfile(): void {
        this.apiAuth
      .meAuthMeGet()
      .pipe(
        tap((user: unknown) => {
          this._authState.update((state) => ({
            ...state,
            user: user as Me,
            isAuthenticated: true,
            isLoading: false
          }));
          this.storageService.setAuthenticated(true);
        }),
        catchError((error) => {

          // Only clear auth if token is expired or invalid
          if (this.isTokenExpired()) {
            this.clearAuth();
            this.storageService.setAuthenticated(false);
          } else {
            // If token is not expired but API call failed, keep the user logged in
            this._authState.update((state) => ({
              ...state,
              isAuthenticated: true,
              isLoading: false
            }));
            this.storageService.setAuthenticated(true);
          }
          return of();
        })
      )
      .subscribe();
  }

  private validateToken(): void {
    ('Validating token...');
    this.setLoading(true);
    this.loadUserProfile();
  }

  private clearAuth(): void {
    this._authState.set({
      user: null,
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

  // Redirect URL handling removed - everything depends on roles
}

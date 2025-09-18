import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { tap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const authService = inject(AuthService);
  const token = storageService.token();

  // Skip interceptor for login requests
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });

    return next(authReq).pipe(
      tap({
        error: (error) => {
          // Check if the error is due to invalid token
          if (error.status === 401 ||
              (error.error && error.error.detail === "Invalid token") ||
              (error.error && error.error.detail === "Token expired") ||
              (error.error && typeof error.error.detail === 'string' && error.error.detail.toLowerCase().includes('token'))) {

            // Logout and clear storage
            authService.logout();
          }
        }
      })
    );
  }

  return next(req);
};

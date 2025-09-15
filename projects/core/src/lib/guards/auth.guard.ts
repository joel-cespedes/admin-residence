import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    if (authService.isTokenExpired()) {
      authService.logout();
      return router.parseUrl('/login');
    }
    return true;
  }

  authService.setRedirectUrl(state.url);
  return router.parseUrl('/login');
};

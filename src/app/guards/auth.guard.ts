import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '@core';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthGuard checking authentication...');
  console.log('Token exists:', !!authService.getToken());
  console.log('Is authenticated:', authService.isAuthenticated());
  console.log('User:', authService.user());

  if (authService.isAuthenticated()) {
    console.log('User is authenticated, allowing access');
    return true;
  }

  console.log('User is not authenticated, redirecting to login');
  router.navigate(['/login']);
  return false;
};
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRole = authService.userRole();

    if (!userRole || !allowedRoles.includes(userRole)) {
      router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  };
};

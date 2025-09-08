import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ResidenceService } from '../services/residence.service';

export const residenceGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const residenceService = inject(ResidenceService);
  const router = inject(Router);

  // Superadmin no necesita seleccionar residencia
  if (authService.isSuperAdmin()) {
    return true;
  }

  // Si necesita seleccionar residencia, redirigir
  if (residenceService.needsResidenceSelection()) {
    router.navigate(['/select-residence']);
    return false;
  }

  return true;
};

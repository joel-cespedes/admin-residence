import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResidenceService } from '../services/residence.service';
import { AuthService } from '../services/auth.service';

export const residenceInterceptor: HttpInterceptorFn = (req, next) => {
  const residenceService = inject(ResidenceService);
  const authService = inject(AuthService);
  const selectedResidenceId = residenceService.selectedResidenceId();

  // Skip for login requests, auth endpoints, and if header already exists
  if (req.url.includes('/auth/') || req.headers.has('X-Residence-Id')) {
    return next(req);
  }

  // For dashboard requests, if no residence is selected but user is superadmin,
  // get the first residence or use a default one
  if (req.url.includes('/dashboard/') && !selectedResidenceId) {
    if (authService.isSuperAdmin()) {
      // Try to get residences and use the first one
      const residences = residenceService.residences();
      if (residences && residences.length > 0) {
        const firstResidenceId = residences[0].id;
        residenceService.selectResidence(firstResidenceId);
        const residenceReq = req.clone({
          headers: req.headers.set('X-Residence-Id', firstResidenceId)
        });
        return next(residenceReq);
      }
    }
  }

  if (selectedResidenceId) {
    const residenceReq = req.clone({
      headers: req.headers.set('X-Residence-Id', selectedResidenceId)
    });
    return next(residenceReq);
  }

  return next(req);
};

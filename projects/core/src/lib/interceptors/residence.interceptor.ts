import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const residenceInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const selectedResidenceId = storageService.selectedResidenceId();

  // Skip for login requests, auth endpoints, and if header already exists
  if (req.url.includes('/auth/') || req.headers.has('X-Residence-Id')) {
    return next(req);
  }

  // For dashboard requests, if no residence is selected, try to get one from localStorage
  // This is a simplified approach - in a real app, you might want to fetch residences first
  if (req.url.includes('/dashboard/') && !selectedResidenceId) {
    // For now, let the request proceed without residence ID
    // The backend should handle this case appropriately
    return next(req);
  }

  if (selectedResidenceId) {
    const residenceReq = req.clone({
      headers: req.headers.set('X-Residence-Id', selectedResidenceId)
    });
    return next(residenceReq);
  }

  return next(req);
};

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const residenceInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const selectedResidenceId = storageService.selectedResidenceId();

  // Skip for login requests, auth endpoints, residences endpoint, and if header already exists
  if (req.url.includes('/auth/') || req.url.includes('/residences/') || req.headers.has('X-Residence-Id')) {
    return next(req);
  }

  // For dashboard endpoints, only add residence ID if available
  // Don't block requests - let the backend handle missing residence ID
  if (req.url.includes('/dashboard/')) {
    if (selectedResidenceId) {
      const residenceReq = req.clone({
        headers: req.headers.set('X-Residence-Id', selectedResidenceId)
      });
      return next(residenceReq);
    }
    // If no residence selected, let request proceed without header
    // Backend will handle it appropriately (e.g., return error or use default for superadmin)
  }

  // For other endpoints, add residence ID if available
  if (selectedResidenceId) {
    const residenceReq = req.clone({
      headers: req.headers.set('X-Residence-Id', selectedResidenceId)
    });
    return next(residenceReq);
  }

  return next(req);
};

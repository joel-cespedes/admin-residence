import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const residenceInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const selectedResidenceId = storageService.selectedResidenceId();

  // Skip for login requests, auth endpoints, residences endpoint (including navigation counts), and if header already exists
  if (req.url.includes('/auth/') || req.url.includes('/residences/') || req.headers.has('X-Residence-Id')) {
    return next(req);
  }

  // For dashboard endpoints (except navigation counts), add residence ID if available
  // Navigation counts don't need residence ID - backend filters by user's assigned residences
  if (req.url.includes('/dashboard/') && !req.url.includes('/navigation-counts')) {
    if (selectedResidenceId) {
      const residenceReq = req.clone({
        headers: req.headers.set('X-Residence-Id', selectedResidenceId)
      });
      return next(residenceReq);
    }
    // If no residence selected, let request proceed without header
    // Backend will handle it appropriately
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

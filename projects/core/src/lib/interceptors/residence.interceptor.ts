import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResidenceService } from '../services/residence.service';

export const residenceInterceptor: HttpInterceptorFn = (req, next) => {
  const residenceService = inject(ResidenceService);
  const selectedResidenceId = residenceService.selectedResidenceId();

  if (selectedResidenceId && !req.headers.has('X-Residence-Id')) {
    const residenceReq = req.clone({
      headers: req.headers.set('X-Residence-Id', selectedResidenceId)
    });
    return next(residenceReq);
  }

  return next(req);
};

import { HttpInterceptorFn } from '@angular/common/http';

export const residenceInterceptor: HttpInterceptorFn = (req, next) => {
  // Removed X-Residence-Id dependency - everything works based on user roles
  // Backend handles filtering based on user's assigned residences

  // Let all requests proceed without residence header
  return next(req);
};

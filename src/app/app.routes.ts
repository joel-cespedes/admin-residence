import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./dashboard/dashboard.route').then(m => m.dashboardRoutes)
  }
];

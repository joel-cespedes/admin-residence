import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.Home)
  },
  {
    path: 'tasks',
    loadComponent: () => import('./task/task').then(m => m.Task)
  },
  {
    path: 'movements',
    loadComponent: () => import('./movements/movements').then(m => m.Movements)
  },
  {
    path: 'behavior',
    loadComponent: () => import('./behavior/behavior').then(m => m.Behavior)
  },
  {
    path: 'devices',
    loadComponent: () => import('./devices/devices').then(m => m.Devices)
  },
  {
    path: 'residences',
    loadComponent: () => import('./residence/residence').then(m => m.Residence)
  },
  {
    path: 'rooms',
    loadComponent: () => import('./room/room').then(m => m.Room)
  },
  {
    path: 'residents',
    loadComponent: () => import('./residents/residents').then(m => m.Residents)
  },
  {
    path: 'categories',
    loadComponent: () => import('./category/category').then(m => m.Category)
  },
  {
    path: 'professionals',
    loadComponent: () => import('./professional/professional').then(m => m.Professional)
  },
  {
    path: 'managers',
    loadComponent: () => import('./managers/managers').then(m => m.Managers)
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

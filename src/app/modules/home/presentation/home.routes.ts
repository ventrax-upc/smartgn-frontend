import { Routes } from '@angular/router';

export const HOME_ROUTES: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./views/dashboard/dashboard').then((m) => m.DashboardPage),
  },
];

import { Routes } from '@angular/router';
import { roleGuard } from '../../iam/presentation/guards/role.guard';

/*
  Support routes are mounted inside the authenticated layout. The help center,
  tickets and visits are available to every authenticated account; the
  technician directory is restricted to SuperAdmin.
*/
export const SUPPORT_ROUTES: Routes = [
  {
    path: 'support',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'guides' },
      {
        path: 'guides',
        loadComponent: () =>
          import('./views/guides/guides').then((m) => m.GuidesPage),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./views/tickets/tickets').then((m) => m.TicketsPage),
      },
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./views/ticket-detail/ticket-detail').then((m) => m.TicketDetailPage),
      },
      {
        path: 'visits',
        loadComponent: () =>
          import('./views/visits/visits').then((m) => m.VisitsPage),
      },
      {
        path: 'technicians',
        canActivate: [roleGuard('SUPERADMIN')],
        loadComponent: () =>
          import('./views/technicians/technicians').then((m) => m.TechniciansPage),
      },
    ],
  },
];

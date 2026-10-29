import { Routes } from '@angular/router';
import { principalGuard } from '../../iam/presentation/guards/principal.guard';
import { roleGuard } from '../../iam/presentation/guards/role.guard';
import { userGuard } from '../../iam/presentation/guards/user.guard';

/*
  Installation bounded context routes.

  - Properties and supply points are owned by the principal USER.
  - Meters (read model) is available to any USER, never SuperAdmin.
  - Installations and the installer directory are SuperAdmin operations.
  - Devices are visible to the owning account and to SuperAdmin.
*/
export const INSTALLATION_ROUTES: Routes = [
  {
    path: 'installation',
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/home' },
      {
        path: 'properties',
        canActivate: [principalGuard],
        loadComponent: () =>
          import('./views/properties/properties').then((m) => m.PropertiesPage),
      },
      {
        path: 'properties/:id',
        canActivate: [principalGuard],
        loadComponent: () =>
          import('./views/property-detail/property-detail').then((m) => m.PropertyDetailPage),
      },
      {
        path: 'meters',
        canActivate: [userGuard],
        loadComponent: () =>
          import('./views/meters/meters').then((m) => m.MetersPage),
      },
      {
        path: 'installations',
        canActivate: [roleGuard('SUPERADMIN')],
        loadComponent: () =>
          import('./views/installations/installations').then((m) => m.InstallationsPage),
      },
      {
        path: 'devices',
        loadComponent: () =>
          import('./views/devices/devices').then((m) => m.DevicesPage),
      },
      {
        path: 'installers',
        canActivate: [roleGuard('SUPERADMIN')],
        loadComponent: () =>
          import('./views/installers/installers').then((m) => m.InstallersPage),
      },
    ],
  },
];

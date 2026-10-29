import { Routes } from '@angular/router';
import { Layout } from './shared/presentation/components/layout/layout';
import { authGuard } from './modules/iam/presentation/guards/auth.guard';
import { IAM_ROUTES } from './modules/iam/presentation/iam.routes';

/*
  SmartGN has no landing page: the app boots into the authenticated shell.
  Public IAM pages (sign-in, password recovery, activation) sit at the root;
  every other feature is lazily mounted inside the shared Layout.
*/
export const routes: Routes = [
  ...IAM_ROUTES,

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./modules/iam/presentation/views/role-redirect/role-redirect').then(
            (m) => m.RoleRedirect,
          ),
      },
      {
        path: '',
        loadChildren: () =>
          import('./modules/home/presentation/home.routes').then((m) => m.HOME_ROUTES),
      },
      {
        path: '',
        loadChildren: () =>
          import('./modules/installation/presentation/installation.routes').then(
            (m) => m.INSTALLATION_ROUTES,
          ),
      },
      {
        path: '',
        loadChildren: () =>
          import('./modules/support/presentation/support.routes').then(
            (m) => m.SUPPORT_ROUTES,
          ),
      },
      {
        path: '',
        loadChildren: () =>
          import('./modules/payment/presentation/payment.routes').then(
            (m) => m.PAYMENT_ROUTES,
          ),
      },
      {
        path: '',
        loadChildren: () =>
          import('./modules/iam/presentation/iam.routes').then((m) => m.IAM_ACCOUNT_ROUTES),
      },
    ],
  },

  { path: '**', redirectTo: '/home' },
];

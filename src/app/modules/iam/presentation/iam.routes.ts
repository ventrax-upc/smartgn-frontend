import { Routes } from '@angular/router';
import { guestGuard } from './guards/guest.guard';
import { principalGuard } from './guards/principal.guard';

/*
  Public IAM routes. SmartGN has no public sign-up: accounts are provisioned
  after a confirmed purchase and activated with a one-time token.
*/
export const IAM_ROUTES: Routes = [
  {
    path: 'sign-in',
    canActivate: [guestGuard],
    loadComponent: () => import('./views/login/login').then((m) => m.Login),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./views/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./views/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'activate-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./views/activate-password/activate-password').then((m) => m.ActivatePassword),
  },
];

/*
  Authenticated account routes mounted inside the shared layout.
*/
export const IAM_ACCOUNT_ROUTES: Routes = [
  {
    path: 'account',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'profile',
      },
      {
        path: 'profile',
        loadComponent: () => import('./views/profile/profile').then((m) => m.ProfilePage),
      },
      {
        path: 'subusers',
        canActivate: [principalGuard],
        loadComponent: () =>
          import('./views/subusers/subusers').then((m) => m.SubusersPage),
      },
    ],
  },
];

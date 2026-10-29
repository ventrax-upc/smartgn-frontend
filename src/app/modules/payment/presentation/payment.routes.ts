import { Routes } from '@angular/router';
import { principalGuard } from '../../iam/presentation/guards/principal.guard';

/*
  Billing belongs to the principal USER account. Delegated subusers and
  SuperAdmin cannot reach subscription, cards or payment history.
*/
export const PAYMENT_ROUTES: Routes = [
  {
    path: 'payments',
    canActivate: [principalGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'subscription' },
      {
        path: 'subscription',
        loadComponent: () =>
          import('./views/subscription/subscription').then((m) => m.SubscriptionPage),
      },
      {
        path: 'methods',
        loadComponent: () =>
          import('./views/payment-methods/payment-methods').then((m) => m.PaymentMethodsPage),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./views/payments/payments').then((m) => m.PaymentsPage),
      },
    ],
  },
];

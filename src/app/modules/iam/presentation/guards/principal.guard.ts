import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../application/auth.store';

/*
  Some features (properties, subusers, billing) belong to the principal USER
  account only. Delegated accounts and SuperAdmin are redirected home.
*/
export const principalGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const user = authStore.currentUser();
  if (!user) return router.createUrlTree(['/sign-in']);
  return user.role === 'USER' && user.accountKind === 'PRINCIPAL'
    ? true
    : router.createUrlTree(['/home']);
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../application/auth.store';
import { defaultRouteForUser } from '../../application/default-route.util';

export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  return authStore.isAuthenticated()
    ? router.createUrlTree([defaultRouteForUser(authStore.currentUser())])
    : true;
};

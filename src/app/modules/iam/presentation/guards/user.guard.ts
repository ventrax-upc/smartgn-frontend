import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../application/auth.store';

/*
  Allows any USER account (principal or delegated) and rejects SuperAdmin.
  Used by customer-facing read models such as /meters, which the installation
  service forbids for the administrator role.
*/
export const userGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const user = authStore.currentUser();
  if (!user) return router.createUrlTree(['/sign-in']);
  return user.role === 'USER' ? true : router.createUrlTree(['/home']);
};

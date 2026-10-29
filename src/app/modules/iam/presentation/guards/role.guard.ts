import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../application/auth.store';
import { Role } from '../../domain/model/user.entity';

/*
  Restricts a route to the given IAM roles. Usage:
    canActivate: [roleGuard('SUPERADMIN')]
*/
export function roleGuard(...roles: Role[]): CanActivateFn {
  return () => {
    const authStore = inject(AuthStore);
    const router = inject(Router);
    const user = authStore.currentUser();
    if (!user) return router.createUrlTree(['/sign-in']);
    return roles.includes(user.role) ? true : router.createUrlTree(['/home']);
  };
}

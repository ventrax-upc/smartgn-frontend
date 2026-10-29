import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../application/auth.store';
import { defaultRouteForUser } from '../../../application/default-route.util';

/*
  The root authenticated path resolves through this component so the landing
  route always follows the signed-in account instead of being hard-coded.
*/
@Component({
  selector: 'app-role-redirect',
  template: `<div class="loading-row"><span class="spinner"></span>Loading SmartGN...</div>`,
})
export class RoleRedirect {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  constructor() {
    this.router.navigateByUrl(defaultRouteForUser(this.authStore.currentUser()));
  }
}

import { TranslatePipe } from '@ngx-translate/core';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { environment } from '../../../../../../environments/environment';
import { AuthStore } from '../../../application/auth.store';
import { defaultRouteForUser } from '../../../application/default-route.util';

@Component({
  selector: 'app-login',
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink, MatIcon],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly loading = this.authStore.loading;
  protected readonly error = this.authStore.error;
  protected readonly showDemoAccounts = environment.showDemoAccounts;
  protected readonly showPassword = signal(false);

  protected readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  protected readonly heroFeatures = [
    'ui.realTimeEnergyVisibilityForEverySupply',
    'ui.onePlaceToFollowInstallationsAndDevices',
    'ui.supportTicketsTechnicalVisitsAndBillingHistory',
    'ui.delegatedAccessWithoutSharingYourPassword',
  ];

  protected toggleShowPassword(): void {
    this.showPassword.update((value) => !value);
  }

  protected getError(field: 'email' | 'password'): string | null {
    const control = this.form.get(field);
    if (!control || !control.touched || control.valid) return null;
    if (control.hasError('required')) return 'ui.thisFieldIsRequired';
    if (control.hasError('email')) return 'ui.enterAValidEmailAddress';
    return null;
  }

  protected useDemo(email: string): void {
    this.form.setValue({ email, password: 'SmartGN123' });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.authStore.login(email!, password!, {
      onSuccess: (user) => this.router.navigateByUrl(defaultRouteForUser(user)),
    });
  }
}

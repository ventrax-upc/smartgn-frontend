import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageToggle } from '../../../../../shared/presentation/components/language-toggle/language-toggle';
import { PasswordToggle } from '../../../../../shared/presentation/components/password-toggle';
import { AuthStore } from '../../../application/auth.store';
import { defaultRouteForUser } from '../../../application/default-route.util';
import { AuthApi } from '../../../infrastructure/auth-api';

@Component({
  selector: 'app-forgot-password',
  imports: [LanguageToggle, PasswordToggle, TranslatePipe, ReactiveFormsModule, RouterLink, MatIcon],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly api = inject(AuthApi);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private challengeId = '';
  private resetToken = '';

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly step = signal<'email' | 'code' | 'password'>('email');
  protected readonly showPassword = signal(false);

  protected readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email, Validators.maxLength(254)],
  });
  protected readonly code = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[0-9]{6}$/)],
  });
  protected readonly passwords = new FormGroup({
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72)] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected sendCode(): void {
    if (this.loading() || this.email.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.requestRecoveryCode(this.email.value).subscribe({
      next: ({ challengeId }) => {
        this.challengeId = challengeId;
        this.code.reset();
        this.step.set('code');
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const errors: Record<number, string> = {
          404: 'ui.recoveryEmailNotRegistered',
          409: 'ui.recoveryAccountInactive',
          429: 'apiErrors.rateLimited',
        };
        this.error.set(errors[err.status] ?? 'ui.couldNotRequestThePasswordReset');
        this.loading.set(false);
      },
    });
  }

  protected verifyCode(): void {
    if (this.loading() || this.code.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.verifyRecoveryCode(this.challengeId, this.code.value).subscribe({
      next: ({ token }) => {
        this.resetToken = token;
        this.step.set('password');
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 422 ? 'ui.recoveryCodeInvalid' : 'apiErrors.unexpected');
        this.loading.set(false);
      },
    });
  }

  protected savePassword(): void {
    if (this.loading() || this.passwords.invalid) return;
    const { newPassword, confirmPassword } = this.passwords.getRawValue();
    if (newPassword !== confirmPassword) {
      this.error.set('ui.passwordsDoNotMatch');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.authStore.resetPassword(this.resetToken, newPassword, {
      onSuccess: () => {
        this.resetToken = '';
        this.passwords.reset();
        this.authStore.login(this.email.value, newPassword, {
          onSuccess: user => this.router.navigateByUrl(defaultRouteForUser(user)),
          onError: () => this.router.navigate(['/sign-in']),
        });
      },
      onError: message => {
        this.error.set(message);
        this.loading.set(false);
      },
    });
  }

  protected restart(): void {
    this.challengeId = '';
    this.resetToken = '';
    this.code.reset();
    this.passwords.reset();
    this.showPassword.set(false);
    this.error.set(null);
    this.step.set('email');
  }

  protected togglePassword(): void {
    this.showPassword.update(value => !value);
  }
}

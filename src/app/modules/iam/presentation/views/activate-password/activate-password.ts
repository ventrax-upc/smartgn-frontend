import { PasswordToggle } from '../../../../../shared/presentation/components/password-toggle';
import { LanguageToggle } from '../../../../../shared/presentation/components/language-toggle/language-toggle';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { AuthStore } from '../../../application/auth.store';

@Component({
  selector: 'app-activate-password',
  imports: [PasswordToggle, LanguageToggle, TranslatePipe, ReactiveFormsModule, RouterLink, MatIcon],
  templateUrl: './activate-password.html',
  styleUrl: './activate-password.css',
})
export class ActivatePassword {
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);
  protected readonly showPassword = signal(false);

  protected readonly form = new FormGroup({
    activationToken: new FormControl(
      this.route.snapshot.queryParamMap.get('token') ??
        this.route.snapshot.queryParamMap.get('activationToken') ??
        '',
      [Validators.required],
    ),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  protected toggleShowPassword(): void {
    this.showPassword.update((value) => !value);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { activationToken, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.error.set('ui.passwordsDoNotMatch');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.authStore.activatePassword(activationToken!, newPassword!, {
      onSuccess: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      onError: (message) => {
        this.loading.set(false);
        this.error.set(message);
      },
    });
  }
}

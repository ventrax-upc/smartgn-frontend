import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { AuthStore } from '../../../application/auth.store';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, MatIcon],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);
  protected readonly showPassword = signal(false);

  protected readonly form = new FormGroup({
    token: new FormControl(this.route.snapshot.queryParamMap.get('token') ?? '', [
      Validators.required,
    ]),
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
    const { token, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.authStore.resetPassword(token!, newPassword!, {
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

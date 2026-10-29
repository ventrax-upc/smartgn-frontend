import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { AuthStore } from '../../../application/auth.store';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, MatIcon],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sent = signal(false);
  protected readonly demoToken = signal<string | null>(null);

  protected readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.authStore.requestPasswordReset(this.form.getRawValue().email!, {
      onSuccess: (token) => {
        this.loading.set(false);
        this.sent.set(true);
        this.demoToken.set(token);
      },
      onError: (message) => {
        this.loading.set(false);
        this.error.set(message);
      },
    });
  }

  protected continueToReset(): void {
    const token = this.demoToken();
    this.router.navigate(['/reset-password'], {
      queryParams: token ? { token } : {},
    });
  }

  protected useAnotherEmail(): void {
    this.sent.set(false);
    this.demoToken.set(null);
    this.form.reset();
  }
}

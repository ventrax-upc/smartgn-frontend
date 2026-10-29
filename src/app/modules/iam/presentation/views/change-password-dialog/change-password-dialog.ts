import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AuthStore } from '../../../application/auth.store';

@Component({
  selector: 'app-change-password-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIcon],
  templateUrl: './change-password-dialog.html',
  styleUrl: './change-password-dialog.css',
})
export class ChangePasswordDialog {
  private readonly authStore = inject(AuthStore);
  protected readonly dialogRef = inject(MatDialogRef<ChangePasswordDialog, boolean>);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = new FormGroup({
    currentPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  protected toggleShowPassword(): void {
    this.showPassword.update((value) => !value);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.authStore.changePassword(currentPassword!, newPassword!, {
      onSuccess: () => {
        this.loading.set(false);
        this.dialogRef.close(true);
      },
      onError: (message) => {
        this.loading.set(false);
        this.error.set(message);
      },
    });
  }
}

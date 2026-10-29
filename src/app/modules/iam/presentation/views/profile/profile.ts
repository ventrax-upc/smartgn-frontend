import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '../../../application/auth.store';
import { ChangePasswordDialog } from '../change-password-dialog/change-password-dialog';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, MatIcon],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);

  protected readonly user = this.authStore.currentUser;
  protected readonly profile = this.authStore.profile;
  protected readonly initials = this.authStore.initials;
  protected readonly displayName = this.authStore.displayName;

  protected readonly saving = signal(false);
  protected readonly success = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly accessLabel = computed(() => {
    const user = this.user();
    if (!user) return '';
    if (user.isSuperAdmin) return 'SuperAdmin';
    return user.isDelegated ? 'Delegated user' : 'Principal user';
  });

  protected readonly form = new FormGroup({
    firstName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    lastName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    phone: new FormControl('', [Validators.pattern(/^\+?[0-9 ()-]{7,20}$/)]),
    address: new FormControl('', [Validators.maxLength(255)]),
  });

  ngOnInit(): void {
    this.patchFromProfile();
    this.authStore.loadProfile();
    // The profile may arrive after the first patch when it was not cached.
    setTimeout(() => this.patchFromProfile(), 400);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.success.set(null);
    this.error.set(null);
    const value = this.form.getRawValue();
    this.authStore.saveProfile(
      {
        firstName: value.firstName ?? '',
        lastName: value.lastName ?? '',
        phone: value.phone ?? '',
        address: value.address ?? '',
      },
      {
        onSuccess: () => {
          this.saving.set(false);
          this.success.set('Your profile was saved.');
          this.patchFromProfile();
        },
        onError: (message) => {
          this.saving.set(false);
          this.error.set(message);
        },
      },
    );
  }

  protected openChangePassword(): void {
    this.dialog.open(ChangePasswordDialog, { width: '440px' });
  }

  private patchFromProfile(): void {
    const profile = this.profile();
    if (!profile) return;
    this.form.patchValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      address: profile.address,
    });
  }
}

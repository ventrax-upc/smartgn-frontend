import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthApi } from '../infrastructure/auth-api';
import { ProfileApi } from '../infrastructure/profile-api';
import { ProfileInputResource } from '../infrastructure/profile-response';
import { AccountKind, Role, User } from '../domain/model/user.entity';
import { Profile } from '../domain/model/profile.entity';

/*
  Local storage keys. smartgn:authUser keeps the identity and the cached
  profile between reloads; smartgn:accessToken is read by apiInterceptor.
*/
const SESSION_KEY = 'smartgn:authUser';
const TOKEN_KEY = 'smartgn:accessToken';

interface StoredProfile {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

interface StoredUser {
  id: string;
  email: string;
  role: Role;
  accountKind: AccountKind;
  profile?: StoredProfile | null;
}

/*
  AuthStore is the single source of truth for the authenticated session and
  its profile. Views never talk to AuthApi/ProfileApi directly.
*/
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authApi = inject(AuthApi);
  private readonly profileApi = inject(ProfileApi);

  private readonly userSignal = signal<User | null>(this.restoreUser());
  readonly currentUser = this.userSignal.asReadonly();

  private readonly profileSignal = signal<Profile | null>(this.restoreProfile());
  readonly profile = this.profileSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  readonly isSuperAdmin = computed(() => this.userSignal()?.isSuperAdmin ?? false);
  readonly isDelegated = computed(() => this.userSignal()?.isDelegated ?? false);
  readonly isPrincipalUser = computed(
    () => this.userSignal()?.canManageProperties ?? false,
  );

  readonly displayName = computed(
    () => this.profileSignal()?.fullName || this.userSignal()?.email || 'SmartGN user',
  );

  readonly initials = computed(() => {
    const profile = this.profileSignal();
    if (profile) return profile.initials;
    const email = this.userSignal()?.email ?? '';
    return email.slice(0, 2).toUpperCase();
  });

  login(
    email: string,
    password: string,
    callbacks?: { onSuccess?: (user: User) => void; onError?: (message: string) => void },
  ): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.authApi.signIn(email, password).subscribe({
      next: ({ user, token }) => {
        this.applySession(user, token);
        this.loadProfile();
        this.loadingSignal.set(false);
        callbacks?.onSuccess?.(user);
      },
      error: (err) => {
        const message = this.messageFrom(err, 'Invalid email or password.');
        this.errorSignal.set(message);
        this.loadingSignal.set(false);
        callbacks?.onError?.(message);
      },
    });
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    this.userSignal.set(null);
    this.profileSignal.set(null);
    this.errorSignal.set(null);
  }

  loadProfile(): void {
    if (!this.userSignal()) return;
    this.profileApi.getMine().subscribe({
      next: (profile) => this.setProfile(profile),
      error: () => {
        // A 404 simply means the account has not created its profile yet.
        this.setProfile(null);
      },
    });
  }

  saveProfile(
    input: ProfileInputResource,
    callbacks?: { onSuccess?: (profile: Profile) => void; onError?: (message: string) => void },
  ): void {
    const request = this.profileSignal()
      ? this.profileApi.updateMine(input)
      : this.profileApi.create(input);

    request.subscribe({
      next: (profile) => {
        this.setProfile(profile);
        callbacks?.onSuccess?.(profile);
      },
      error: (err) => callbacks?.onError?.(this.messageFrom(err, 'Could not save your profile.')),
    });
  }

  changePassword(
    currentPassword: string,
    newPassword: string,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.authApi.changePassword(currentPassword, newPassword).subscribe({
      next: () => callbacks?.onSuccess?.(),
      error: (err) => callbacks?.onError?.(this.messageFrom(err, 'Could not change the password.')),
    });
  }

  requestPasswordReset(
    email: string,
    callbacks?: {
      onSuccess?: (demoToken: string | null) => void;
      onError?: (message: string) => void;
    },
  ): void {
    this.authApi.requestPasswordReset(email).subscribe({
      next: (result) => callbacks?.onSuccess?.(result.demoResetToken ?? null),
      error: (err) =>
        callbacks?.onError?.(this.messageFrom(err, 'Could not request the password reset.')),
    });
  }

  resetPassword(
    token: string,
    newPassword: string,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.authApi.resetPassword(token, newPassword).subscribe({
      next: () => callbacks?.onSuccess?.(),
      error: (err) =>
        callbacks?.onError?.(this.messageFrom(err, 'The reset token is invalid or has expired.')),
    });
  }

  activatePassword(
    activationToken: string,
    newPassword: string,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.authApi.activatePassword(activationToken, newPassword).subscribe({
      next: () => callbacks?.onSuccess?.(),
      error: (err) => callbacks?.onError?.(this.messageFrom(err, 'Could not activate the account.')),
    });
  }

  private applySession(user: User, token: string): void {
    const stored: StoredUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      accountKind: user.accountKind,
      profile: null,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
    localStorage.setItem(TOKEN_KEY, token);
    this.userSignal.set(user);
    this.profileSignal.set(null);
  }

  private setProfile(profile: Profile | null): void {
    this.profileSignal.set(profile);
    const user = this.userSignal();
    if (!user) return;
    const stored: StoredUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      accountKind: user.accountKind,
      profile: profile
        ? {
            id: profile.id,
            accountId: profile.accountId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
            address: profile.address,
          }
        : null,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
  }

  private restoreUser(): User | null {
    const stored = this.readStoredUser();
    if (!stored) return null;
    return new User({
      id: stored.id,
      email: stored.email,
      role: stored.role,
      accountKind: stored.accountKind,
    });
  }

  private restoreProfile(): Profile | null {
    const stored = this.readStoredUser();
    if (!stored?.profile) return null;
    return new Profile(stored.profile);
  }

  private readStoredUser(): StoredUser | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }

  private messageFrom(err: unknown, fallback: string): string {
    return err instanceof Error && err.message ? err.message : fallback;
  }
}

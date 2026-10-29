import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from '../domain/model/user.entity';
import { UserAssembler } from './user-assembler';
import { AuthenticatedUserResource, ForgotPasswordResource } from './user-response';

export interface AuthResult {
  user: User;
  token: string;
}

/*
  AuthApi mirrors the IAM AuthController:
    POST /auth/sign-in
    POST /auth/forgot-password
    POST /auth/reset-password
    POST /auth/activate-password
    POST /auth/change-password
*/
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly assembler = inject(UserAssembler);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  signIn(email: string, password: string): Observable<AuthResult> {
    return this.http
      .post<AuthenticatedUserResource>(`${this.baseUrl}/sign-in`, {
        email: email.trim().toLowerCase(),
        password,
      })
      .pipe(
        map((resource) => ({
          user: this.assembler.toEntityFromResource(resource),
          token: resource.token,
        })),
        catchError((err) =>
          throwError(() => this.toError(err, 'Invalid email or password.')),
        ),
      );
  }

  requestPasswordReset(email: string): Observable<ForgotPasswordResource> {
    return this.http
      .post<ForgotPasswordResource>(`${this.baseUrl}/forgot-password`, {
        email: email.trim().toLowerCase(),
      })
      .pipe(
        catchError((err) =>
          throwError(() => this.toError(err, 'Could not request the password reset.')),
        ),
      );
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/reset-password`, {
        token: token.trim(),
        newPassword,
      })
      .pipe(
        catchError((err) =>
          throwError(() => this.toError(err, 'The reset token is invalid or has expired.')),
        ),
      );
  }

  activatePassword(activationToken: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/activate-password`, {
        activationToken: activationToken.trim(),
        newPassword,
      })
      .pipe(
        catchError((err) =>
          throwError(() => this.toError(err, 'The activation token is invalid.')),
        ),
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/change-password`, { currentPassword, newPassword })
      .pipe(
        catchError((err) =>
          throwError(() => this.toError(err, 'Could not change the password.')),
        ),
      );
  }

  private toError(err: unknown, fallback: string): Error {
    const httpErr = err as
      | { error?: { details?: string; message?: string }; message?: string; status?: number }
      | undefined;
    const message = httpErr?.error?.details ?? httpErr?.error?.message ?? httpErr?.message ?? fallback;
    const error = new Error(message) as Error & { status?: number };
    error.status = httpErr?.status;
    return error;
  }
}

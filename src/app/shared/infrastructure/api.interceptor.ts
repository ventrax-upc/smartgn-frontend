import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable, catchError, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStore, TOKEN_KEY } from '../../modules/iam/application/auth.store';

const PUBLIC_AUTH_PATHS = new Set([
  '/auth/sign-in',
  '/auth/forgot-password',
  '/auth/recovery-codes',
  '/auth/recovery-codes/verify',
  '/auth/reset-password',
  '/auth/activate-password',
].map((path) => environment.apiUrl + path));

class UserFacingHttpError extends HttpErrorResponse {
  override readonly message: string;

  constructor(status: number, message: string) {
    super({ status, error: { message } });
    this.message = message;
  }
}

function userFacingError(error: unknown, path: string) {
  if (!(error instanceof HttpErrorResponse)) return throwError(() => error);

  const status = error.status;
  const clientError = status >= 400 && status < 500 && status !== 429;
  const message = clientError && path === '/auth/sign-in'
    ? 'ui.invalidEmailOrPassword'
    : clientError && path === '/auth/activate-password'
      ? 'apiErrors.activationFailed'
      : clientError && path === '/auth/reset-password'
        ? 'ui.theResetTokenIsInvalidOrHas'
        : (STATUS_MESSAGES[status] ?? 'apiErrors.unexpected');

  return throwError(() => new UserFacingHttpError(status, message));
}

const STATUS_MESSAGES: Record<number, string> = {
  0: 'apiErrors.offline',
  400: 'apiErrors.invalidRequest',
  401: 'ui.sessionExpired',
  403: 'apiErrors.forbidden',
  404: 'apiErrors.notFound',
  409: 'apiErrors.conflict',
  422: 'apiErrors.invalidRequest',
  429: 'apiErrors.rateLimited',
};

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl + '/')) return next(req);

  const path = req.url.slice(environment.apiUrl.length).split('?')[0];
  const sanitizeError = catchError<HttpEvent<unknown>, Observable<never>>((error: unknown) => userFacingError(error, path));
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token || PUBLIC_AUTH_PATHS.has(environment.apiUrl + path) || path === '/auth/renew-session') {
    return next(req).pipe(sanitizeError);
  }

  const auth = inject(AuthStore);
  const router = inject(Router);
  const dialog = inject(MatDialog);

  const document = inject(DOCUMENT);
  let requestToken = token;
  const session = document.hidden ? of(token) : auth.renewIfNeeded(token);
  return session.pipe(
    switchMap((currentToken) => {
      requestToken = currentToken;
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${currentToken}` } }));
    }),
    tap({
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401 && auth.expireSession(requestToken)) {
          dialog.closeAll();
          void router.navigateByUrl('/sign-in', { replaceUrl: true });
        }
      },
    }),
    sanitizeError,
  );
};

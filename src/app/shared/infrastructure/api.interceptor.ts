import { HttpInterceptorFn } from '@angular/common/http';

/*
  Adds the SmartGN access token to every outgoing API request.
  The token is stored by AuthStore under smartgn:accessToken.
*/
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('smartgn:accessToken');
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

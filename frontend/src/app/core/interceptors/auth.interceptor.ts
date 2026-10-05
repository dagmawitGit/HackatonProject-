import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionStore } from '../auth/session.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const router = inject(Router);
  const token = session.token();
  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      const message = typeof err.error === 'object' && err.error && 'message' in err.error ? String(err.error.message) : '';
      const suspended = err.status === 403 && message.toLowerCase().includes('suspended');
      const expired = err.status === 401 && !!token && !req.url.includes('/auth/login');
      if (suspended || expired) {
        session.clear();
        void router.navigate(['/login'], { queryParams: suspended ? { suspended: '1' } : {} });
      }
      return throwError(() => err);
    }),
  );
};

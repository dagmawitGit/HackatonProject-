import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SessionStore } from '../auth/session.store';

export const authGuard: CanActivateFn = () => {
  const session = inject(SessionStore);
  const router = inject(Router);
  if (session.token()) return true;
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionStore);
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!session.token()) return true;
  return router.createUrlTree([auth.homeForRole(session.user()?.role)]);
};

export const roleGuard: CanActivateFn = (route) => {
  const session = inject(SessionStore);
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data['roles'] as string[] | undefined;
  const role = session.user()?.role;
  if (role && roles?.includes(role)) return true;
  return router.createUrlTree([auth.homeForRole(role)]);
};

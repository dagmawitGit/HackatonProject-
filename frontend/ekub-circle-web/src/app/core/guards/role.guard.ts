import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { UserRole } from '../models/user-role';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const user = this.authService.currentUser();
    if (!user) {
      return this.router.createUrlTree(['/login']);
    }

    const allowedRoles = route.data['roles'] as UserRole[] | undefined;
    return allowedRoles?.includes(user.role) ?? false;
  }
}

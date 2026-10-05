import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const APP_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then(routes => routes.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(routes => routes.DASHBOARD_ROUTES)
  },
  {
    path: 'circles',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/circles/circles.routes').then(routes => routes.CIRCLES_ROUTES)
  },
  { path: '**', redirectTo: 'dashboard' }
];

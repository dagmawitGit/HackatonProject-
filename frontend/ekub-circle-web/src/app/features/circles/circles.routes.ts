import { Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/role.guard';
import { CirclePageComponent } from './components/circle-page.component';

export const CIRCLES_ROUTES: Routes = [
  {
    path: 'create',
    component: CirclePageComponent,
    canActivate: [RoleGuard],
    data: { title: 'Create circle', roles: ['Organizer', 'PlatformAdmin'] }
  },
  {
    path: ':id/members',
    component: CirclePageComponent,
    data: { title: 'Circle members' }
  },
  {
    path: ':id/summary',
    component: CirclePageComponent,
    data: { title: 'Circle summary' }
  },
  {
    path: ':id/current-round/payments',
    loadChildren: () => import('../payments/payments.routes').then(routes => routes.PAYMENTS_ROUTES)
  },
  {
    path: ':id/current-round',
    loadChildren: () => import('../rounds/rounds.routes').then(routes => routes.ROUNDS_ROUTES)
  },
  {
    path: ':id/history',
    loadChildren: () => import('../history/history.routes').then(routes => routes.HISTORY_ROUTES)
  },
  {
    path: ':id',
    component: CirclePageComponent,
    data: { title: 'Circle details' }
  }
];

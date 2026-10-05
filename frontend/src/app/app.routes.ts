import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

const memberRoles = ['Member', 'Organizer', 'Admin'];

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/auth/landing.component').then((m) => m.LandingComponent) },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', loadComponent: () => import('./features/auth/home-redirect.component').then((m) => m.HomeRedirectComponent) },
      { path: 'member/dashboard', canActivate: [roleGuard], data: { roles: memberRoles }, loadComponent: () => import('./features/member/member-dashboard.component').then((m) => m.MemberDashboardComponent) },
      { path: 'member/equb/:id', canActivate: [roleGuard], data: { roles: memberRoles }, loadComponent: () => import('./features/member/my-equb.component').then((m) => m.MyEqubComponent) },
      { path: 'member/round/:id', canActivate: [roleGuard], data: { roles: memberRoles }, loadComponent: () => import('./features/member/current-round.component').then((m) => m.MemberRoundComponent) },
      { path: 'member/contributions/:id', canActivate: [roleGuard], data: { roles: memberRoles }, loadComponent: () => import('./features/member/contribution-history.component').then((m) => m.ContributionHistoryComponent) },
      { path: 'member/payouts/:id', canActivate: [roleGuard], data: { roles: memberRoles }, loadComponent: () => import('./features/member/payout-history.component').then((m) => m.PayoutHistoryComponent) },
      { path: 'member/profile', canActivate: [roleGuard], data: { roles: memberRoles }, loadComponent: () => import('./features/member/profile.component').then((m) => m.ProfileComponent) },
      { path: 'member/notifications', canActivate: [roleGuard], data: { roles: memberRoles }, loadComponent: () => import('./features/member/notifications.component').then((m) => m.NotificationsComponent) },
      { path: 'organizer/dashboard', canActivate: [roleGuard], data: { roles: ['Organizer'] }, loadComponent: () => import('./features/organizer/organizer-dashboard.component').then((m) => m.OrganizerDashboardComponent) },
      { path: 'organizer/create', canActivate: [roleGuard], data: { roles: ['Organizer'] }, loadComponent: () => import('./features/organizer/create-equb.component').then((m) => m.CreateEqubComponent) },
      { path: 'organizer/circles/:id/members', canActivate: [roleGuard], data: { roles: ['Organizer'] }, loadComponent: () => import('./features/organizer/manage-members.component').then((m) => m.ManageMembersComponent) },
      { path: 'organizer/circles/:id/start', canActivate: [roleGuard], data: { roles: ['Organizer'] }, loadComponent: () => import('./features/organizer/start-equb.component').then((m) => m.StartEqubComponent) },
      { path: 'organizer/circles/:id/round', canActivate: [roleGuard], data: { roles: ['Organizer'] }, loadComponent: () => import('./features/organizer/organizer-round.component').then((m) => m.OrganizerRoundComponent) },
      { path: 'organizer/circles/:id/ledger', canActivate: [roleGuard], data: { roles: ['Organizer'] }, loadComponent: () => import('./features/organizer/contribution-ledger.component').then((m) => m.ContributionLedgerComponent) },
      { path: 'organizer/circles/:id/payout', canActivate: [roleGuard], data: { roles: ['Organizer'] }, loadComponent: () => import('./features/organizer/payout.component').then((m) => m.PayoutComponent) },
      { path: 'organizer/circles/:id/history', canActivate: [roleGuard], data: { roles: ['Organizer'] }, loadComponent: () => import('./features/organizer/round-history.component').then((m) => m.RoundHistoryComponent) },
      { path: 'organizer/circles/:id/summary', canActivate: [roleGuard], data: { roles: ['Organizer'] }, loadComponent: () => import('./features/circle/equb-summary.component').then((m) => m.EqubSummaryComponent) },
      { path: 'admin/dashboard', canActivate: [roleGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent) },
      { path: 'admin/users', canActivate: [roleGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/admin/admin-users.component').then((m) => m.AdminUsersComponent) },
      { path: 'admin/circles', canActivate: [roleGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/admin/admin-circles.component').then((m) => m.AdminCirclesComponent) },
      { path: 'admin/reports', canActivate: [roleGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/admin/admin-reports.component').then((m) => m.AdminReportsComponent) },
      { path: 'admin/audit', canActivate: [roleGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/admin/audit-logs.component').then((m) => m.AuditLogsComponent) },
      { path: 'admin/monitoring', canActivate: [roleGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/admin/monitoring.component').then((m) => m.MonitoringComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];

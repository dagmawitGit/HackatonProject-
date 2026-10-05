import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <a class="brand" routerLink="/">
        <span class="mark">E</span>
        <span>
          <strong>EkubCircle</strong>
          <small>Ledger</small>
        </span>
      </a>
      <nav>
        @for (link of links(); track link.path) {
          <a [routerLink]="link.path" routerLinkActive="active" (click)="close()">{{ link.label }}</a>
        }
      </nav>
    </aside>
  `,
})
export class SidebarComponent {
  private readonly session = inject(SessionStore);
  readonly lang = inject(LanguageService);
  close = (): void => document.body.classList.remove('nav-open');

  readonly links = computed(() => {
    this.lang.lang();
    const role = this.session.user()?.role;
    const t = (key: string) => this.lang.t(key);
    const links = [];
    if (role === 'Organizer') {
      links.push(
        { path: '/app/organizer/dashboard', label: t('dashboard') },
        { path: '/app/organizer/create', label: t('create') },
        { path: '/app/member/dashboard', label: 'My participation' },
      );
    } else if (role === 'Member') {
      links.push({ path: '/app/member/dashboard', label: t('dashboard') });
    }
    links.push(
      { path: '/app/member/notifications', label: t('notifications') },
      { path: '/app/member/profile', label: t('profile') },
    );
    if (role === 'Admin') {
      return [
        { path: '/app/admin/dashboard', label: t('dashboard') },
        { path: '/app/admin/users', label: t('users') },
        { path: '/app/admin/circles', label: t('equbs') },
        { path: '/app/admin/reports', label: t('reports') },
        { path: '/app/admin/audit', label: t('audit') },
        { path: '/app/admin/monitoring', label: t('monitoring') },
      ];
    }
    return links;
  });
}

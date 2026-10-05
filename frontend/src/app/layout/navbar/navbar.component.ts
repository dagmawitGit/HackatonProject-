import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { SessionStore } from '../../core/auth/session.store';
import { LanguageService, LangCode } from '../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  template: `
    <header class="topbar">
      <button class="menu" type="button" (click)="toggle()">Menu</button>
      <p class="ledger-note">{{ lang.t('ledger') }}</p>
      <div class="top-actions">
        <div class="langs" role="group" aria-label="Language">
          @for (item of languages; track item.code) {
            <button type="button" [class.on]="lang.lang() === item.code" (click)="lang.set(item.code)">{{ item.label }}</button>
          }
        </div>
        <a routerLink="/app/member/profile">{{ session.user()?.fullName }}</a>
        <button type="button" class="ghost" (click)="auth.logout()">{{ lang.t('logout') }}</button>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  readonly session = inject(SessionStore);
  readonly auth = inject(AuthService);
  readonly lang = inject(LanguageService);
  readonly languages: { code: LangCode; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'om', label: 'OM' },
    { code: 'am', label: 'አማ' },
  ];

  toggle(): void {
    document.body.classList.toggle('nav-open');
  }
}

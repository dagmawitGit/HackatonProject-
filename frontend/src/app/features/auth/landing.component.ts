import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService, LangCode } from '../../core/services/language.service';
import { DEMO_ACCOUNTS } from '../../shared/models/models';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  template: `
    <div class="public">
      <header class="public-bar">
        <a class="brand" routerLink="/">
          <span class="mark">E</span>
          <strong>EkubCircle</strong>
        </a>
        <div class="langs">
          @for (item of languages; track item.code) {
            <button type="button" [class.on]="lang.lang() === item.code" (click)="lang.set(item.code)">{{ item.label }}</button>
          }
        </div>
        <div class="top-actions">
          <a class="ghost" routerLink="/login">{{ lang.t('login') }}</a>
          <a class="button" routerLink="/register">{{ lang.t('register') }}</a>
        </div>
      </header>

      <section class="hero">
        <h1>EkubCircle</h1>
        <p class="lede">{{ lang.t('tagline') }}</p>
        <p class="callout">{{ lang.t('ledger') }}</p>
        <div class="hero-actions">
          <a class="button" routerLink="/login">Open the ledger</a>
          <a class="ghost" routerLink="/register">Create an account</a>
        </div>
      </section>

      <section class="steps">
        <article>
          <span>01</span>
          <h2>Form the circle</h2>
          <p>An organizer adds members, sets the contribution, and locks a payout order before the equb begins.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Record every contribution</h2>
          <p>Each round stays open until every member, including earlier receivers, has a recorded contribution.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Protect the payout</h2>
          <p>The server refuses an early payout record and sets the receiver from the fixed order. A payout is recorded in the ledger; no funds are sent.</p>
        </article>
      </section>

      <section class="panel">
        <h2>Demo accounts</h2>
        <p>Use these seeded people to walk the judge journey. Passwords are for the local demo only.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Role</th><th>Name</th><th>Email</th><th>Password</th></tr></thead>
            <tbody>
              @for (account of accounts; track account.email) {
                <tr>
                  <td>{{ account.role }}</td>
                  <td>{{ account.name }}</td>
                  <td>{{ account.email }}</td>
                  <td>{{ account.password }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
})
export class LandingComponent {
  readonly lang = inject(LanguageService);
  readonly accounts = DEMO_ACCOUNTS;
  readonly languages: { code: LangCode; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'om', label: 'OM' },
    { code: 'am', label: 'አማ' },
  ];
}

import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-circle-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="subnav">
      @if (mode === 'organizer') {
        <a [routerLink]="['/app/organizer/circles', id, 'members']" routerLinkActive="active">Members</a>
        <a [routerLink]="['/app/organizer/circles', id, 'start']" routerLinkActive="active">Start</a>
        <a [routerLink]="['/app/organizer/circles', id, 'round']" routerLinkActive="active">Current round</a>
        <a [routerLink]="['/app/organizer/circles', id, 'ledger']" routerLinkActive="active">Ledger</a>
        <a [routerLink]="['/app/organizer/circles', id, 'payout']" routerLinkActive="active">Payout</a>
        <a [routerLink]="['/app/organizer/circles', id, 'history']" routerLinkActive="active">History</a>
        <a [routerLink]="['/app/organizer/circles', id, 'summary']" routerLinkActive="active">Summary</a>
      } @else {
        <a [routerLink]="['/app/member/equb', id]" routerLinkActive="active">My equb</a>
        <a [routerLink]="['/app/member/round', id]" routerLinkActive="active">Current round</a>
        <a [routerLink]="['/app/member/contributions', id]" routerLinkActive="active">Contributions</a>
        <a [routerLink]="['/app/member/payouts', id]" routerLinkActive="active">Payouts</a>
      }
    </nav>
  `,
})
export class CircleNavComponent {
  @Input({ required: true }) id = '';
  @Input() mode: 'organizer' | 'member' = 'organizer';
}

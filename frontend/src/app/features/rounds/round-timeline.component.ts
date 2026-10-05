import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EtbPipe } from '../../shared/pipes/etb.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { EqubRound } from '../../shared/models/models';

@Component({
  selector: 'app-round-timeline',
  imports: [DatePipe, EtbPipe, StatusBadgeComponent],
  template: `
    @if (rounds.length === 0) {
      <p class="state">Rounds appear after the equb starts.</p>
    } @else {
      <p class="timeline-progress">
        <strong>{{ paidOutCount }} of {{ rounds.length }}</strong> rounds paid out
      </p>
      <ol class="timeline">
        @for (round of rounds; track round.id) {
          <li
            [class.done]="round.status === 'PAID_OUT'"
            [class.now]="round.status === 'OPEN'"
            [attr.aria-current]="round.status === 'OPEN' ? 'step' : null"
          >
            <div>
              <span>Round {{ round.roundNumber }}</span>
              <strong>{{ round.receiverName }}</strong>
              @if (round.status === 'OPEN') {
                <span class="current-tag">Current round</span>
              }
            </div>
<<<<<<< HEAD
            <app-status-badge [status]="round.status" />
            <em>
              @if (round.payoutAmount) {
                {{ round.payoutAmount | etb }}
              } @else if (round.status === 'OPEN') {
                Collecting contributions
              } @else {
                Upcoming
              }
            </em>
=======
            <app-status-badge [status]="round.status" [label]="round.status === 'PAID_OUT' ? 'Payout recorded' : round.status" />
            <em>{{ round.status === 'PAID_OUT' ? ('Payout record · ' + (round.payoutAmount | etb)) : 'No payout record' }}</em>
>>>>>>> origin/ekubcircle-current
            <small>{{ (round.paidOutAt || round.openedAt) | date: 'medium' }}</small>
          </li>
        }
      </ol>
    }
  `,
  styles: `
    .timeline-progress { margin: 0 0 12px; font-size: 14px; }
    .current-tag {
      display: inline-block;
      margin-left: 8px;
      padding: 1px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .04em;
      text-transform: uppercase;
      background: #f6ead0;
      color: #8a6414;
    }
  `,
})
export class RoundTimelineComponent {
  @Input({ required: true }) rounds: EqubRound[] = [];

  get paidOutCount(): number {
    return this.rounds.filter(r => r.status === 'PAID_OUT').length;
  }
}
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
      <ol class="timeline">
        @for (round of rounds; track round.id) {
          <li [class.done]="round.status === 'PAID_OUT'" [class.now]="round.status === 'OPEN'">
            <div>
              <span>Round {{ round.roundNumber }}</span>
              <strong>{{ round.receiverName }}</strong>
            </div>
            <app-status-badge [status]="round.status" />
            <em>{{ round.payoutAmount ? (round.payoutAmount | etb) : 'Not paid out' }}</em>
            <small>{{ (round.paidOutAt || round.openedAt) | date: 'medium' }}</small>
          </li>
        }
      </ol>
    }
  `,
})
export class RoundTimelineComponent {
  @Input({ required: true }) rounds: EqubRound[] = [];
}

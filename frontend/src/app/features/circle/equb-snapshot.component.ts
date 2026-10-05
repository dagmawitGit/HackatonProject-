import { Component, Input } from '@angular/core';
import { EtbPipe } from '../../shared/pipes/etb.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { CircleSummary } from '../../shared/models/models';

@Component({
  selector: 'app-equb-snapshot',
  imports: [EtbPipe, StatusBadgeComponent],
  template: `
    <section class="stat-grid">
      <article class="stat stat-gold">
        <p>{{ potLabel }}</p>
        <strong>{{ summary.currentPot | etb }}</strong>
      </article>
      <article class="stat">
        <p>{{ paidLabel }}</p>
        <strong>{{ summary.paidCount }} / {{ summary.memberCount }}</strong>
        <span>{{ summary.paymentPercentage }}% of this round</span>
      </article>
      <article class="stat">
        <p>Round</p>
        <strong>{{ summary.currentRound || '—' }} <small>of {{ summary.totalRounds }}</small></strong>
        <span>{{ summary.roundStatus || summary.circleStatus }}</span>
      </article>
      <article class="stat">
        <p>{{ receiverLabel }}</p>
        <strong>{{ summary.currentReceiver || '—' }}</strong>
        <app-status-badge [status]="summary.payoutReady ? 'PAYOUT READY' : 'PAYOUT LOCKED'" />
      </article>
    </section>
  `,
})
export class EqubSnapshotComponent {
  @Input({ required: true }) summary!: CircleSummary;
  @Input() potLabel = 'Current pot';
  @Input() paidLabel = 'Contribution status';
  @Input() receiverLabel = 'Receiver';
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { apiError } from '../../core/api-error';
import { CircleService } from '../../core/services/circle.service';
import { CircleNavComponent } from './circle-nav.component';
import { EqubSnapshotComponent } from './equb-snapshot.component';
import { RoundTimelineComponent } from '../rounds/round-timeline.component';
import { CircleSummary, EqubRound } from '../../shared/models/models';

@Component({
  selector: 'app-equb-summary',
  imports: [CircleNavComponent, EqubSnapshotComponent, RoundTimelineComponent],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Transparency</p>
        <h1>Equb summary</h1>
        <p class="lede">Progress, the next receivers, and a server-side integrity check.</p>
      </div>
    </header>
    <app-circle-nav [id]="id" />
    @if (loading()) { <p class="state">Loading summary...</p> }
    @else if (error()) { <p class="state bad">{{ error() }}</p> }
    @else if (summary()) {
      <app-equb-snapshot [summary]="summary()!" />
      <section class="split">
        <article class="panel">
          <h2>Progress</h2>
          <p>Completion {{ summary()!.completionPercentage }}% · {{ summary()!.receivedCount }} received · {{ summary()!.remainingReceivers }} remaining</p>
          <div class="bar"><span [style.width.%]="summary()!.completionPercentage"></span></div>
          <h3>Next receivers</h3>
          @if (summary()!.nextReceivers.length === 0) { <p class="state">Every member has a payout record.</p> }
          <ol class="order">
            @for (name of summary()!.nextReceivers; track name) { <li>{{ name }}</li> }
          </ol>
        </article>
        <article class="panel">
          <h2>Integrity</h2>
          <ul class="checks">
            <li [class.off]="!summary()!.integrity.allMembersVerified">All members verified</li>
            <li [class.off]="!summary()!.integrity.paymentRecordsComplete">Contribution records consistent</li>
            <li [class.off]="!summary()!.integrity.receiverFromFixedOrder">Receiver determined by fixed order</li>
            <li [class.off]="!summary()!.integrity.noDuplicatePayout">No duplicate payout</li>
            <li [class.off]="!summary()!.integrity.currentRoundValid">Current round valid</li>
          </ul>
        </article>
      </section>
      <app-round-timeline [rounds]="rounds()" />
    }
  `,
})
export class EqubSummaryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CircleService);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly summary = signal<CircleSummary | null>(null);
  readonly rounds = signal<EqubRound[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    forkJoin({ summary: this.api.summary(this.id), rounds: this.api.rounds(this.id) }).subscribe({
      next: ({ summary, rounds }) => {
        this.summary.set(summary);
        this.rounds.set(rounds);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

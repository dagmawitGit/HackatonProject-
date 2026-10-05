import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { apiError } from '../../core/api-error';
import { CircleService } from '../../core/services/circle.service';
import { CircleNavComponent } from '../circle/circle-nav.component';
import { EtbPipe } from '../../shared/pipes/etb.pipe';
import { CircleSummary, EqubRound, PayoutResult } from '../../shared/models/models';

@Component({
  selector: 'app-payout',
  imports: [CircleNavComponent, EtbPipe],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Organizer</p>
        <h1>Payout</h1>
        <p class="lede">You do not choose the receiver. The server reads the fixed order for this round.</p>
      </div>
    </header>
    <app-circle-nav [id]="id" />
    @if (loading()) { <p class="state">Loading payout status...</p> }
    @else if (error() && !summary()) { <p class="state bad">{{ error() }}</p> }
    @else if (summary()) {
      @if (message()) { <p class="banner good">{{ message() }}</p> }
      @if (error()) { <p class="banner bad">{{ error() }}</p> }
      @if (summary()!.circleStatus === 'FORMING') {
        <article class="panel">
          <h2>Equb is still forming</h2>
          <p>Start the equb before anyone can be paid. Rounds do not exist yet.</p>
        </article>
      } @else if (!round()) {
        <article class="panel">
          @if (summary()!.circleStatus === 'COMPLETED' || result()?.circleCompleted) {
            <h2>Equb complete</h2>
            <p>Every member has received exactly once.</p>
          } @else {
            <h2>No open round</h2>
            <p>The next round opens automatically after a payout is recorded. Await the next cycle.</p>
          }
        </article>
      } @else {
        <section class="lock-card" [class.ready]="summary()!.payoutReady">
          <p class="lock-kicker">{{ summary()!.payoutReady ? 'PAYOUT READY' : 'PAYOUT LOCKED' }}</p>
          <h2>{{ summary()!.paidCount }} / {{ summary()!.memberCount }} members paid</h2>
          @if (!summary()!.payoutReady) {
            <p>Waiting for:</p>
            <ul>
              @for (name of summary()!.waitingFor; track name) { <li>{{ name }}</li> }
            </ul>
            <p>Everyone must pay before the pot can be paid.</p>
          } @else {
            <p>Receiver</p>
            <strong>{{ summary()!.currentReceiver }}</strong>
            <p>Amount</p>
            <strong>{{ summary()!.expectedPot | etb }}</strong>
            <p class="fine">Recorded pot = members × contribution. No money moves.</p>
          }
          @if (summary()!.payoutReady && !confirming()) {
            <button class="button" type="button" (click)="confirming.set(true)">Pay out</button>
          }
          @if (confirming()) {
            <div class="modal">
              <p>Record the pot of {{ summary()!.expectedPot | etb }} for round {{ round()!.roundNumber }}?</p>
              <p>The server will pay {{ summary()!.currentReceiver }}. You cannot pick someone else.</p>
              <div class="row">
                <button class="button" type="button" [disabled]="busy()" (click)="payout()">Confirm payout</button>
                <button class="ghost" type="button" (click)="confirming.set(false)">Cancel</button>
              </div>
            </div>
          }
        </section>
        @if (result()?.circleCompleted) {
          <p class="banner good">The equb is complete. Every member received exactly once.</p>
        }
      }
    }
  `,
})
export class PayoutComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CircleService);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly summary = signal<CircleSummary | null>(null);
  readonly round = signal<EqubRound | null>(null);
  readonly result = signal<PayoutResult | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly message = signal('');
  readonly busy = signal(false);
  readonly confirming = signal(false);

  ngOnInit(): void {
    this.reload();
  }

  payout(): void {
    const round = this.round();
    if (!round) return;
    this.busy.set(true);
    this.error.set('');
    this.api.payout(round.id).subscribe({
      next: (result) => {
        this.busy.set(false);
        this.confirming.set(false);
        this.result.set(result);
        this.message.set(result.message);
        this.reload();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.confirming.set(false);
        this.error.set(apiError(err));
        this.reload();
      },
    });
  }

  private reload(): void {
    forkJoin({ summary: this.api.summary(this.id), round: this.api.currentRound(this.id) }).subscribe({
      next: ({ summary, round }) => {
        this.summary.set(summary);
        this.round.set(round);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

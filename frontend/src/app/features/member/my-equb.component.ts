import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { apiError } from '../../core/api-error';
import { SessionStore } from '../../core/auth/session.store';
import { CircleService } from '../../core/services/circle.service';
import { CircleNavComponent } from '../circle/circle-nav.component';
import { EqubSnapshotComponent } from '../circle/equb-snapshot.component';
import { Circle, CircleSummary, Member } from '../../shared/models/models';

@Component({
  selector: 'app-my-equb',
  imports: [CircleNavComponent, EqubSnapshotComponent],
  template: `
    @if (loading()) { <p class="state">Loading your equb...</p> }
    @else if (error()) { <p class="state bad">{{ error() }}</p> }
    @else if (circle() && summary()) {
      <header class="page-head">
        <div>
          <p class="eyebrow">{{ circle()!.meetingLabel }}</p>
          <h1>{{ circle()!.name }}</h1>
          <p class="lede">The current pot, fixed receiver, and whether your contribution is recorded for this round.</p>
        </div>
      </header>
      <app-circle-nav [id]="id" mode="member" />
      <app-equb-snapshot [summary]="summary()!" />
      <section class="split">
        <article class="panel">
          <h2>Your place</h2>
          @if (me()) {
            <p>Payout order <strong>#{{ me()!.payoutOrder }}</strong></p>
            <p>Contribution status: <strong>{{ me()!.paidCurrentRound ? 'Paid' : 'Unpaid' }}</strong></p>
            <p>Payout record: <strong>{{ me()!.hasReceived ? 'Recorded — still contribute in future rounds' : 'Not yet' }}</strong></p>
          } @else {
            <p class="state">You are viewing this equb, but your membership row was not found.</p>
          }
        </article>
        <article class="panel">
          <h2>Still to receive</h2>
          @if (summary()!.nextReceivers.length === 0 && !summary()!.currentReceiver) {
            <p class="state">Every member has received once.</p>
          } @else {
            <ol class="order">
              @if (summary()!.currentReceiver) { <li class="now">Now · {{ summary()!.currentReceiver }}</li> }
              @for (name of summary()!.nextReceivers; track name) { <li>{{ name }}</li> }
            </ol>
          }
        </article>
      </section>
    }
  `,
})
export class MyEqubComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CircleService);
  private readonly session = inject(SessionStore);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly loading = signal(true);
  readonly error = signal('');
  readonly circle = signal<Circle | null>(null);
  readonly summary = signal<CircleSummary | null>(null);
  readonly me = signal<Member | null>(null);

  ngOnInit(): void {
    forkJoin({
      circle: this.api.get(this.id),
      summary: this.api.summary(this.id),
      members: this.api.members(this.id),
    }).subscribe({
      next: ({ circle, summary, members }) => {
        this.circle.set(circle);
        this.summary.set(summary);
        this.me.set(members.find((member) => member.userId === this.session.user()?.id) ?? null);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

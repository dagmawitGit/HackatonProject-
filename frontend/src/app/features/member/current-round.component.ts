import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { apiError } from '../../core/api-error';
import { CircleService } from '../../core/services/circle.service';
import { CircleNavComponent } from '../circle/circle-nav.component';
import { EqubSnapshotComponent } from '../circle/equb-snapshot.component';
import { CircleSummary, EqubRound, Member } from '../../shared/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-member-round',
  imports: [CircleNavComponent, EqubSnapshotComponent, StatusBadgeComponent],
  template: `
    <header class="page-head"><div><p class="eyebrow">Member</p><h1>Current round</h1></div></header>
    <app-circle-nav [id]="id" mode="member" />
    @if (loading()) { <p class="state">Loading the current round...</p> }
    @else if (error()) { <p class="state bad">{{ error() }}</p> }
    @else if (summary()) {
      <app-equb-snapshot [summary]="summary()!" />
      @if (!round()) {
        <p class="state">There is no open round right now.</p>
      } @else {
        <article class="panel">
          <h2>Round {{ round()!.roundNumber }} · fixed receiver {{ round()!.receiverName }}</h2>
          <p>The receiver is fixed for this round. Members with payout records from earlier rounds still contribute.</p>
          <h3>Contribution status</h3>
          <ul class="people">
            @for (member of members(); track member.id) {
              <li>
                <span>{{ member.payoutOrder }}. {{ member.fullName }}</span>
                <app-status-badge [status]="member.paidCurrentRound ? 'RECORDED' : 'UNPAID'" [label]="member.paidCurrentRound ? 'Paid' : 'Unpaid'" />
                @if (member.hasReceived) { <em class="still">Has a payout record — still contributes</em> }
              </li>
            }
          </ul>
        </article>
      }
    }
  `,
})
export class MemberRoundComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CircleService);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly loading = signal(true);
  readonly error = signal('');
  readonly summary = signal<CircleSummary | null>(null);
  readonly round = signal<EqubRound | null>(null);
  readonly members = signal<Member[]>([]);

  ngOnInit(): void {
    forkJoin({
      summary: this.api.summary(this.id),
      round: this.api.currentRound(this.id),
      members: this.api.members(this.id),
    }).subscribe({
      next: ({ summary, round, members }) => {
        this.summary.set(summary);
        this.round.set(round);
        this.members.set(members);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

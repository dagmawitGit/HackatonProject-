import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { apiError } from '../../core/api-error';
import { CircleService } from '../../core/services/circle.service';
import { CircleNavComponent } from '../circle/circle-nav.component';
import { EqubSnapshotComponent } from '../circle/equb-snapshot.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { Circle, CircleSummary, EqubRound, Member } from '../../shared/models/models';

@Component({
  selector: 'app-organizer-round',
  imports: [RouterLink, CircleNavComponent, EqubSnapshotComponent, StatusBadgeComponent],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Organizer</p>
        <h1>Current round</h1>
        <p class="lede">Record one contribution per member. Someone who already received the pot still appears here.</p>
      </div>
    </header>
    <app-circle-nav [id]="id" />
    @if (loading()) { <p class="state">Loading the current round...</p> }
    @else if (error() && !circle()) { <p class="state bad">{{ error() }}</p> }
    @else if (circle()) {
      @if (summary()) { <app-equb-snapshot [summary]="summary()!" /> }
      @if (message()) { <p class="banner good">{{ message() }}</p> }
      @if (error()) { <p class="banner bad">{{ error() }}</p> }
      @if (circle()!.status === 'FORMING') {
        <p class="state">Start the equb before recording payments. <a [routerLink]="['/app/organizer/circles', id, 'start']">Go to start</a></p>
      } @else if (circle()!.status === 'COMPLETED') {
        <p class="banner good">Every member has received exactly once. This equb is complete.</p>
      } @else if (!round()) {
        <article class="panel">
          <h2>No open round</h2>
          <p>The previous round is paid out. Open the next one when the circle meets again.</p>
          <button class="button" type="button" [disabled]="busy()" (click)="openNext()">Open next round</button>
        </article>
      } @else {
        <article class="panel">
          <div class="row">
            <h2>Round {{ round()!.roundNumber }} of {{ summary()?.totalRounds }}</h2>
            <app-status-badge [status]="round()!.status" />
          </div>
          <ul class="people">
            @for (member of members(); track member.id) {
              <li [class.received]="member.hasReceived">
                <span>
                  <strong>{{ member.fullName }}</strong>
                  @if (member.id === round()!.receiverMemberId) { <em>Receiver this round</em> }
                  @if (member.hasReceived) { <em class="still">Already received — still pays</em> }
                </span>
                @if (member.paidCurrentRound) {
                  <app-status-badge status="RECORDED" label="Paid" />
                } @else {
                  <button class="button" type="button" [disabled]="busyId() === member.id" (click)="mark(member)">
                    {{ busyId() === member.id ? 'Saving...' : 'Mark paid' }}
                  </button>
                }
              </li>
            }
          </ul>
          <a class="button" [routerLink]="['/app/organizer/circles', id, 'payout']">Go to payout</a>
        </article>
      }
    }
  `,
})
export class OrganizerRoundComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CircleService);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly circle = signal<Circle | null>(null);
  readonly summary = signal<CircleSummary | null>(null);
  readonly round = signal<EqubRound | null>(null);
  readonly members = signal<Member[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly message = signal('');
  readonly busy = signal(false);
  readonly busyId = signal('');

  ngOnInit(): void {
    this.reload();
  }

  mark(member: Member): void {
    const round = this.round();
    if (!round) return;
    this.busyId.set(member.id);
    this.error.set('');
    this.api.recordPayment(round.id, member.id).subscribe({
      next: () => {
        this.busyId.set('');
        this.message.set(`${member.fullName} is recorded as paid.`);
        this.reload();
      },
      error: (err: unknown) => {
        this.busyId.set('');
        this.error.set(apiError(err));
      },
    });
  }

  openNext(): void {
    this.busy.set(true);
    this.error.set('');
    this.api.openNext(this.id).subscribe({
      next: (round) => {
        this.busy.set(false);
        this.message.set(`Round ${round.roundNumber} is open. ${round.receiverName} is the fixed receiver.`);
        this.reload();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(apiError(err));
      },
    });
  }

  private reload(): void {
    forkJoin({
      circle: this.api.get(this.id),
      summary: this.api.summary(this.id),
      round: this.api.currentRound(this.id),
      members: this.api.members(this.id),
    }).subscribe({
      next: ({ circle, summary, round, members }) => {
        this.circle.set(circle);
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

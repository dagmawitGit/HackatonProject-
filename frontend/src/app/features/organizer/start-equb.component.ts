import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { apiError } from '../../core/api-error';
import { CircleService } from '../../core/services/circle.service';
import { CircleNavComponent } from '../circle/circle-nav.component';
import { RoundTimelineComponent } from '../rounds/round-timeline.component';
import { Circle, EqubRound, Member } from '../../shared/models/models';
import { EtbPipe } from '../../shared/pipes/etb.pipe';

@Component({
  selector: 'app-start-equb',
  imports: [CircleNavComponent, RoundTimelineComponent, EtbPipe],
  template: `
    <header class="page-head"><div><p class="eyebrow">Organizer</p><h1>Start equb</h1></div></header>
    <app-circle-nav [id]="id" />
    @if (loading()) { <p class="state">Loading equb...</p> }
    @else if (error() && !circle()) { <p class="state bad">{{ error() }}</p> }
    @else if (circle()) {
      <article class="panel">
        <h2>{{ circle()!.name }}</h2>
        <p>Contribution {{ circle()!.contributionAmount | etb }} · {{ circle()!.meetingLabel }} · {{ members().length }} members</p>
        @if (circle()!.status === 'FORMING') {
          <ul class="checks">
            <li>Member list becomes locked</li>
            <li>Contribution amount becomes locked</li>
            <li>Payout order becomes locked</li>
            <li>{{ members().length }} rounds are created, one receiver each</li>
          </ul>
          <ol class="order">
            @for (member of members(); track member.id) {
              <li>Round {{ member.payoutOrder }} → {{ member.fullName }}</li>
            }
          </ol>
          @if (error()) { <p class="banner bad">{{ error() }}</p> }
          @if (!confirming()) {
            <button class="button" type="button" (click)="confirming.set(true)" [disabled]="members().length < 2">Start equb</button>
          } @else {
            <div class="modal">
              <p>Start {{ circle()!.name }}? This cannot be undone.</p>
              <div class="row">
                <button class="button" type="button" [disabled]="busy()" (click)="start()">Yes, start</button>
                <button class="ghost" type="button" (click)="confirming.set(false)">Cancel</button>
              </div>
            </div>
          }
        } @else {
          <p class="banner good">This equb is {{ circle()!.status }}. The order below is fixed.</p>
          <app-round-timeline [rounds]="rounds()" />
        }
      </article>
    }
  `,
})
export class StartEqubComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CircleService);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly circle = signal<Circle | null>(null);
  readonly members = signal<Member[]>([]);
  readonly rounds = signal<EqubRound[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly confirming = signal(false);

  ngOnInit(): void {
    this.reload();
  }

  start(): void {
    this.busy.set(true);
    this.error.set('');
    this.api.start(this.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.confirming.set(false);
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
      members: this.api.members(this.id),
      rounds: this.api.rounds(this.id),
    }).subscribe({
      next: ({ circle, members, rounds }) => {
        this.circle.set(circle);
        this.members.set(members);
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

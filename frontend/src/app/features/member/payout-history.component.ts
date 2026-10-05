import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { apiError } from '../../core/api-error';
import { CircleService } from '../../core/services/circle.service';
import { CircleNavComponent } from '../circle/circle-nav.component';
import { RoundTimelineComponent } from '../rounds/round-timeline.component';
import { EqubRound } from '../../shared/models/models';

@Component({
  selector: 'app-payout-history',
  imports: [CircleNavComponent, RoundTimelineComponent],
  template: `
    <header class="page-head"><div><p class="eyebrow">Member</p><h1>Payout History</h1><p class="lede">Payout records show the fixed receiver and recorded pot. They do not send funds.</p></div></header>
    <app-circle-nav [id]="id" mode="member" />
    @if (loading()) { <p class="state">Loading payout history...</p> }
    @else if (error()) { <p class="state bad">{{ error() }}</p> }
    @else { <app-round-timeline [rounds]="rounds()" /> }
  `,
})
export class PayoutHistoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CircleService);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly loading = signal(true);
  readonly error = signal('');
  readonly rounds = signal<EqubRound[]>([]);

  ngOnInit(): void {
    this.api.rounds(this.id).subscribe({
      next: (rounds) => {
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

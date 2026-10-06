import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { apiError } from '../../core/api-error';
import { CircleService } from '../../core/services/circle.service';
import { ContributionTableComponent } from '../payments/contribution-table.component';
import { CircleNavComponent } from '../circle/circle-nav.component';
import { ContributionRecord } from '../../shared/models/models';

@Component({
  selector: 'app-contribution-history',
  imports: [ContributionTableComponent, CircleNavComponent],
  template: `
    <header class="page-head"><div><p class="eyebrow">Member</p><h1>Contribution history</h1><p class="lede">Your recorded contributions. Each entry is a ledger record; the app does not send funds.</p></div></header>
    <app-circle-nav [id]="id" mode="member" />
    @if (loading()) { <p class="state">Loading contributions...</p> }
    @else if (error()) { <p class="state bad">{{ error() }}</p> }
    @else { <app-contribution-table [contributions]="mine()" /> }
  `,
})
export class ContributionHistoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CircleService);
  private readonly session = inject(SessionStore);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly loading = signal(true);
  readonly error = signal('');
  readonly mine = signal<ContributionRecord[]>([]);

  ngOnInit(): void {
    this.api.circleContributions(this.id).subscribe({
      next: (contributions) => {
        const name = this.session.user()?.fullName;
        this.mine.set(contributions.filter((contribution) => contribution.memberName === name));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { apiError } from '../../core/api-error';
import { CircleService } from '../../core/services/circle.service';
import { CircleNavComponent } from '../circle/circle-nav.component';
import { ContributionTableComponent } from '../payments/contribution-table.component';
import { ContributionRecord } from '../../shared/models/models';

@Component({
  selector: 'app-contribution-ledger',
  imports: [CircleNavComponent, ContributionTableComponent],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Organizer</p>
        <h1>Contribution ledger</h1>
        <p class="lede">Every contribution recorded in this equb. Duplicate contributions are rejected by the server.</p>
      </div>
    </header>
    <app-circle-nav [id]="id" />
    @if (loading()) { <p class="state">Loading the ledger...</p> }
    @else if (error()) { <p class="state bad">Failed to load the ledger. {{ error() }}</p> }
    @else { <app-contribution-table [contributions]="contributions()" /> }
  `,
})
export class ContributionLedgerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CircleService);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly contributions = signal<ContributionRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.api.circleContributions(this.id).subscribe({
      next: (contributions) => {
        this.contributions.set(contributions);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

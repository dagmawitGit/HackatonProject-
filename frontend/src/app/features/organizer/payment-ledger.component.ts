import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { apiError } from '../../core/api-error';
import { CircleService } from '../../core/services/circle.service';
import { CircleNavComponent } from '../circle/circle-nav.component';
import { PaymentTableComponent } from '../payments/payment-table.component';
import { PaymentRecord } from '../../shared/models/models';

@Component({
  selector: 'app-payment-ledger',
  imports: [CircleNavComponent, PaymentTableComponent],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Organizer</p>
        <h1>Contribution ledger</h1>
        <p class="lede">Every recorded contribution in this equb. Duplicate contributions are rejected by the server.</p>
      </div>
    </header>
    <app-circle-nav [id]="id" />
    @if (loading()) { <p class="state">Loading the ledger...</p> }
    @else if (error()) { <p class="state bad">Failed to load the ledger. {{ error() }}</p> }
    @else { <app-payment-table [payments]="payments()" /> }
  `,
})
export class PaymentLedgerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CircleService);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly payments = signal<PaymentRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.api.circlePayments(this.id).subscribe({
      next: (payments) => {
        this.payments.set(payments);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

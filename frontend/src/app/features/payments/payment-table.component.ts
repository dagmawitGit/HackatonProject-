import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EtbPipe } from '../../shared/pipes/etb.pipe';
import { PaymentRecord } from '../../shared/models/models';

@Component({
  selector: 'app-payment-table',
  imports: [DatePipe, EtbPipe],
  template: `
    @if (payments.length === 0) {
      <p class="state">No contributions have been recorded yet.</p>
    } @else {
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Round</th>
              <th>Member</th>
              <th>Amount</th>
              <th>Recorded</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            @for (payment of payments; track payment.id) {
              <tr>
                <td>Round {{ payment.roundNumber }}</td>
                <td>
                  {{ payment.memberName }}
                  @if (payment.hasReceived) { <em class="still">Already received — still pays</em> }
                </td>
                <td>{{ payment.amount | etb }}</td>
                <td>{{ payment.recordedAt | date: 'medium' }}</td>
                <td>{{ payment.recordedByName }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class PaymentTableComponent {
  @Input({ required: true }) payments: PaymentRecord[] = [];
}

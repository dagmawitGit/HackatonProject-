import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EtbPipe } from '../../shared/pipes/etb.pipe';
import { ContributionRecord } from '../../shared/models/models';

@Component({
  selector: 'app-contribution-table',
  imports: [DatePipe, EtbPipe],
  template: `
    @if (contributions.length === 0) {
      <p class="state">No contributions have been recorded yet.</p>
    } @else {
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Round</th>
              <th>Member</th>
              <th>Contribution</th>
              <th>Recorded</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            @for (contribution of contributions; track contribution.id) {
              <tr>
                <td>Round {{ contribution.roundNumber }}</td>
                <td>
                  {{ contribution.memberName }}
                  @if (contribution.hasReceived) { <em class="still">Has a payout record — still contributes</em> }
                </td>
                <td>{{ contribution.amount | etb }}</td>
                <td>{{ contribution.recordedAt | date: 'medium' }}</td>
                <td>{{ contribution.recordedByName }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class ContributionTableComponent {
  @Input({ required: true }) contributions: ContributionRecord[] = [];
}

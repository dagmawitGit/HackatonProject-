import { Component, inject, OnInit, signal } from '@angular/core';
import { apiError } from '../../core/api-error';
import { AdminService } from '../../core/services/admin.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { CircleReport } from '../../shared/models/models';
import { EtbPipe } from '../../shared/pipes/etb.pipe';

@Component({
  selector: 'app-admin-reports',
  imports: [StatusBadgeComponent, EtbPipe],
  template: `
    <header class="page-head"><div><p class="eyebrow">Admin</p><h1>Reports</h1><p class="lede">Recorded contribution and payout ledger totals only; no funds are sent.</p></div></header>
    @if (loading()) { <p class="state">Loading reports...</p> }
    @else if (error()) { <p class="state bad">{{ error() }}</p> }
    @else if (rows().length === 0) { <p class="state">No equbs to report yet.</p> }
    @else {
      <div class="table-wrap">
        <table>
          <thead><tr><th>Equb</th><th>Status</th><th>Organizer</th><th>Received</th><th>Contributions</th><th>Payouts</th></tr></thead>
          <tbody>
            @for (row of rows(); track row.circleId) {
              <tr>
                <td>{{ row.circleName }}</td>
                <td><app-status-badge [status]="row.isSuspended ? 'SUSPENDED' : row.status" /></td>
                <td>{{ row.organizerName }}</td>
                <td>{{ row.receivedCount }} / {{ row.memberCount }}</td>
                <td>{{ row.totalRecordedPayments | etb }}</td>
                <td>{{ row.totalPayouts | etb }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class AdminReportsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  readonly rows = signal<CircleReport[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.admin.reports().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

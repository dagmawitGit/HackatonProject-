import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiError } from '../../core/api-error';
import { AdminService } from '../../core/services/admin.service';
import { AdminOverview } from '../../shared/models/models';
import { EtbPipe } from '../../shared/pipes/etb.pipe';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, EtbPipe],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Platform admin</p>
        <h1>Dashboard</h1>
        <p class="lede">Watch the platform. Suspending a user or an equb does not rewrite the ledger.</p>
      </div>
    </header>
    @if (loading()) { <p class="state">Loading overview...</p> }
    @else if (error()) { <p class="state bad">{{ error() }}</p> }
    @else if (overview()) {
      <section class="stat-grid">
        <article class="stat"><p>Users</p><strong>{{ overview()!.userCount }}</strong><span>{{ overview()!.suspendedUserCount }} suspended</span></article>
        <article class="stat"><p>Equbs</p><strong>{{ overview()!.circleCount }}</strong><span>{{ overview()!.activeCircleCount }} active</span></article>
        <article class="stat"><p>Recorded contributions</p><strong>{{ overview()!.recordedContributions | etb }}</strong><span>Ledger only</span></article>
        <article class="stat"><p>Recorded payouts</p><strong>{{ overview()!.recordedPayouts | etb }}</strong><span>{{ overview()!.auditEventCount }} audit events</span></article>
      </section>
      <div class="card-grid">
        <a class="circle-card" routerLink="/app/admin/users"><h2>Users</h2><p>Search, suspend, reactivate.</p></a>
        <a class="circle-card" routerLink="/app/admin/circles"><h2>Equbs</h2><p>Search and suspend a problematic circle.</p></a>
        <a class="circle-card" routerLink="/app/admin/audit"><h2>Audit logs</h2><p>See rejected payouts and other activity.</p></a>
      </div>
    }
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly admin = inject(AdminService);
  readonly overview = signal<AdminOverview | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.admin.overview().subscribe({
      next: (overview) => {
        this.overview.set(overview);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

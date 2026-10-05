import { Component, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { apiError } from '../../core/api-error';
import { AdminService } from '../../core/services/admin.service';
import { AdminOverview } from '../../shared/models/models';

@Component({
  selector: 'app-monitoring',
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Admin</p>
        <h1>System monitoring</h1>
        <p class="lede">The API is up, the database is reachable, and no payment gateway is connected.</p>
      </div>
    </header>
    @if (loading()) { <p class="state">Checking the system...</p> }
    @else if (error()) { <p class="state bad">{{ error() }}</p> }
    @else {
      <ul class="checks">
        <li>API status {{ health()?.status }}</li>
        <li [class.off]="health()?.database !== 'connected'">Database {{ health()?.database }}</li>
        <li>Money movement: {{ health()?.moneyMovement }}</li>
        <li>Active equbs: {{ overview()?.activeCircleCount }}</li>
        <li>Forming equbs: {{ overview()?.formingCount }}</li>
        <li>Completed equbs: {{ overview()?.completedCount }}</li>
        <li>Suspended equbs: {{ overview()?.suspendedCircleCount }}</li>
        <li>Suspended users: {{ overview()?.suspendedUserCount }}</li>
      </ul>
    }
  `,
})
export class MonitoringComponent implements OnInit {
  private readonly admin = inject(AdminService);
  readonly health = signal<{ status: string; database: string; moneyMovement: string } | null>(null);
  readonly overview = signal<AdminOverview | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    forkJoin({ health: this.admin.health(), overview: this.admin.overview() }).subscribe({
      next: ({ health, overview }) => {
        this.health.set(health);
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

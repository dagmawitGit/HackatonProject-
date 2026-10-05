import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { apiError } from '../../core/api-error';
import { AdminService } from '../../core/services/admin.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { AdminCircle } from '../../shared/models/models';
import { EtbPipe } from '../../shared/pipes/etb.pipe';

@Component({
  selector: 'app-admin-circles',
  imports: [ReactiveFormsModule, StatusBadgeComponent, EtbPipe],
  template: `
    <header class="page-head"><div><p class="eyebrow">Admin</p><h1>Equbs</h1><p class="lede">Suspension blocks new ledger changes. It does not edit payouts.</p></div></header>
    <form class="inline" [formGroup]="form" (ngSubmit)="load()">
      <label>Search<input formControlName="search" placeholder="Equb or organizer" /></label>
      <button class="button" type="submit">Search</button>
    </form>
    @if (message()) { <p class="banner good">{{ message() }}</p> }
    @if (error()) { <p class="banner bad">{{ error() }}</p> }
    @if (loading()) { <p class="state">Loading equbs...</p> }
    @else if (circles().length === 0) { <p class="state">No equbs matched that search.</p> }
    @else {
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Organizer</th><th>Status</th><th>Members</th><th>Contribution</th><th></th></tr></thead>
          <tbody>
            @for (circle of circles(); track circle.id) {
              <tr>
                <td>{{ circle.name }}</td>
                <td>{{ circle.organizerName }}</td>
                <td>
                  <app-status-badge [status]="circle.status" />
                  @if (circle.isSuspended) { <app-status-badge status="SUSPENDED" /> }
                </td>
                <td>{{ circle.memberCount }}</td>
                <td>{{ circle.contributionAmount | etb }}</td>
                <td>
                  <button class="ghost" type="button" (click)="toggle(circle)">{{ circle.isSuspended ? 'Reactivate' : 'Suspend' }}</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class AdminCirclesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({ search: [''] });
  readonly circles = signal<AdminCircle[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly message = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.admin.circles(this.form.controls.search.getRawValue()).subscribe({
      next: (circles) => {
        this.circles.set(circles);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }

  toggle(circle: AdminCircle): void {
    const suspended = !circle.isSuspended;
    if (!confirm(`${suspended ? 'Suspend' : 'Reactivate'} ${circle.name}?`)) return;
    this.admin.setSuspension(circle.id, suspended).subscribe({
      next: () => {
        this.message.set(`${circle.name} is ${suspended ? 'suspended' : 'active again'}.`);
        this.load();
      },
      error: (err: unknown) => this.error.set(apiError(err)),
    });
  }
}

import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { apiError } from '../../core/api-error';
import { AdminService } from '../../core/services/admin.service';
import { AuditEntry } from '../../shared/models/models';

@Component({
  selector: 'app-audit-logs',
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <header class="page-head"><div><p class="eyebrow">Admin</p><h1>Audit logs</h1><p class="lede">Including payout attempts the server rejected.</p></div></header>
    <form class="inline" [formGroup]="form" (ngSubmit)="load()">
      <label>Search<input formControlName="search" placeholder="Name or description" /></label>
      <label>Action
        <select formControlName="action">
          <option value="">All</option>
          <option>USER_LOGIN</option>
          <option>CIRCLE_CREATED</option>
          <option>CIRCLE_STARTED</option>
          <option value="PAYMENT_RECORDED">CONTRIBUTION_RECORDED</option>
          <option>PAYOUT_ATTEMPTED</option>
          <option>PAYOUT_COMPLETED</option>
          <option>ROUND_OPENED</option>
          <option>ADMIN_USER_SUSPENDED</option>
          <option>ADMIN_CIRCLE_SUSPENDED</option>
        </select>
      </label>
      <button class="button" type="submit">Filter</button>
    </form>
    @if (loading()) { <p class="state">Loading audit logs...</p> }
    @else if (error()) { <p class="state bad">{{ error() }}</p> }
    @else if (logs().length === 0) { <p class="state">No audit events matched.</p> }
    @else {
      <ul class="feed">
        @for (log of logs(); track log.id) {
          <li>
            <strong>{{ actionLabel(log.action) }}</strong>
            <p>{{ log.description }}</p>
            <small>{{ log.userName || 'System' }} · {{ log.createdAt | date: 'medium' }}</small>
          </li>
        }
      </ul>
    }
  `,
})
export class AuditLogsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({ search: [''], action: [''] });
  readonly logs = signal<AuditEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.load();
  }

  actionLabel(action: string): string {
    return action === 'PAYMENT_RECORDED' ? 'CONTRIBUTION_RECORDED' : action;
  }

  load(): void {
    this.loading.set(true);
    const raw = this.form.getRawValue();
    this.admin.audit(raw.search, raw.action).subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

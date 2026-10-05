import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { apiError } from '../../core/api-error';
import { AdminService } from '../../core/services/admin.service';
import { SessionStore } from '../../core/auth/session.store';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UserProfile } from '../../shared/models/models';

@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule, StatusBadgeComponent],
  template: `
    <header class="page-head"><div><p class="eyebrow">Admin</p><h1>Users</h1></div></header>
    <form class="inline" [formGroup]="form" (ngSubmit)="load()">
      <label>Search<input formControlName="search" placeholder="Name or email" /></label>
      <button class="button" type="submit">Search</button>
    </form>
    @if (message()) { <p class="banner good">{{ message() }}</p> }
    @if (error()) { <p class="banner bad">{{ error() }}</p> }
    @if (loading()) { <p class="state">Loading users...</p> }
    @else if (users().length === 0) { <p class="state">No users matched that search.</p> }
    @else {
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr>
                <td>{{ user.fullName }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.role }}</td>
                <td><app-status-badge [status]="user.status" /></td>
                <td>
                  @if (user.id !== session.user()?.id) {
                    <button class="ghost" type="button" (click)="toggle(user)">
                      {{ user.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend' }}
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class AdminUsersComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  readonly session = inject(SessionStore);
  readonly form = this.fb.nonNullable.group({ search: [''] });
  readonly users = signal<UserProfile[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly message = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.admin.users(this.form.controls.search.getRawValue()).subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }

  toggle(user: UserProfile): void {
    const next = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    if (!confirm(`${next === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} ${user.fullName}?`)) return;
    this.admin.setUserStatus(user.id, next).subscribe({
      next: () => {
        this.message.set(`${user.fullName} is now ${next}.`);
        this.load();
      },
      error: (err: unknown) => this.error.set(apiError(err)),
    });
  }
}

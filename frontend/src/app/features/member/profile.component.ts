import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { apiError } from '../../core/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { UserProfile } from '../../shared/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-profile',
  imports: [DatePipe, StatusBadgeComponent],
  template: `
    <header class="page-head"><div><p class="eyebrow">Account</p><h1>Profile</h1></div></header>
    @if (loading()) { <p class="state">Loading profile...</p> }
    @else if (error()) { <p class="state bad">{{ error() }}</p> }
    @else if (user()) {
      <article class="panel identity">
        <h2>{{ user()!.fullName }}</h2>
        <p>{{ user()!.email }}</p>
        <p><app-status-badge [status]="user()!.role" /> <app-status-badge [status]="user()!.status" /></p>
        <p>Joined {{ user()!.createdAt | date: 'mediumDate' }}</p>
      </article>
    }
  `,
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly user = signal<UserProfile | null>(null);

  ngOnInit(): void {
    this.auth.me().subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { apiError } from '../../core/api-error';
import { CircleService } from '../../core/services/circle.service';
import { Notice } from '../../shared/models/models';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Activity</p>
        <h1>Notifications</h1>
        <p class="lede">Recent ledger events for your circles. This is an activity feed, not SMS.</p>
      </div>
    </header>
    @if (loading()) { <p class="state">Loading notifications...</p> }
    @else if (error()) { <p class="state bad">{{ error() }}</p> }
    @else if (items().length === 0) { <p class="state">No activity yet.</p> }
    @else {
      <ul class="feed">
        @for (item of items(); track item.id) {
          <li>
            <strong>{{ item.action }}</strong>
            <p>{{ item.description }}</p>
            <small>{{ item.createdAt | date: 'medium' }}</small>
          </li>
        }
      </ul>
    }
  `,
})
export class NotificationsComponent implements OnInit {
  private readonly api = inject(CircleService);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly items = signal<Notice[]>([]);

  ngOnInit(): void {
    this.api.notifications().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

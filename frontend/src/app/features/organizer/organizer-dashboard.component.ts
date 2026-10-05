import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { apiError } from '../../core/api-error';
import { CircleService } from '../../core/services/circle.service';
import { LanguageService } from '../../core/services/language.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { Circle } from '../../shared/models/models';
import { EtbPipe } from '../../shared/pipes/etb.pipe';

@Component({
  selector: 'app-organizer-dashboard',
  imports: [RouterLink, StatusBadgeComponent, EtbPipe],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Organizer</p>
        <h1>{{ lang.t('dashboard') }}</h1>
        <p class="lede">Circles you keep. Create Unity Equb here when you are ready for the live demo.</p>
      </div>
      <a class="button" routerLink="/app/organizer/create">{{ lang.t('create') }}</a>
    </header>
    @if (loading()) { <p class="state">Loading equbs...</p> }
    @else if (error()) { <p class="state bad">{{ error() }}</p> }
    @else if (circles().length === 0) { <p class="state">No equb yet. Create one and add the six demo members.</p> }
    @else {
      <div class="card-grid">
        @for (circle of circles(); track circle.id) {
          <a class="circle-card" [routerLink]="circle.status === 'FORMING' ? ['/app/organizer/circles', circle.id, 'members'] : ['/app/organizer/circles', circle.id, 'round']">
            <div class="row">
              <h2>{{ circle.name }}</h2>
              <app-status-badge [status]="circle.isSuspended ? 'SUSPENDED' : circle.status" />
            </div>
            <p>{{ circle.contributionAmount | etb }} · {{ circle.meetingLabel }}</p>
            <p>{{ circle.memberCount }} members</p>
          </a>
        }
      </div>
    }
  `,
})
export class OrganizerDashboardComponent implements OnInit {
  private readonly api = inject(CircleService);
  private readonly session = inject(SessionStore);
  readonly lang = inject(LanguageService);
  readonly circles = signal<Circle[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    const me = this.session.user()?.id;
    this.api.list().subscribe({
      next: (circles) => {
        this.circles.set(circles.filter((circle) => circle.organizerId === me));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

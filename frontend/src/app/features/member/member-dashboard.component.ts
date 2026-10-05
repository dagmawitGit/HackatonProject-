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
  selector: 'app-member-dashboard',
  imports: [RouterLink, StatusBadgeComponent, EtbPipe],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Member</p>
        <h1>{{ lang.t('dashboard') }}</h1>
        <p class="lede">Circles you belong to. Open one to see the pot, your payment, and who receives next.</p>
      </div>
    </header>
    @if (loading()) { <p class="state">Loading your equbs...</p> }
    @else if (error()) { <p class="state bad">{{ error() }}</p> }
    @else if (circles().length === 0) {
      <p class="state">You have not joined an equb yet. Ask the organizer to add {{ session.user()?.email }}.</p>
    } @else {
      <div class="card-grid">
        @for (circle of circles(); track circle.id) {
          <a class="circle-card" [routerLink]="['/app/member/equb', circle.id]">
            <div class="row">
              <h2>{{ circle.name }}</h2>
              <app-status-badge [status]="circle.isSuspended ? 'SUSPENDED' : circle.status" />
            </div>
            <p>{{ circle.contributionAmount | etb }} · {{ circle.meetingLabel }}</p>
            <p>{{ circle.memberCount }} members · Organizer {{ circle.organizerName }}</p>
          </a>
        }
      </div>
    }
  `,
})
export class MemberDashboardComponent implements OnInit {
  private readonly circlesApi = inject(CircleService);
  readonly session = inject(SessionStore);
  readonly lang = inject(LanguageService);
  readonly circles = signal<Circle[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.circlesApi.list().subscribe({
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
}

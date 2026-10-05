import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { SessionStore } from '../../core/auth/session.store';

@Component({
  selector: 'app-home-redirect',
  template: `<p class="state">Opening your desk...</p>`,
})
export class HomeRedirectComponent implements OnInit {
  private readonly session = inject(SessionStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.router.navigate([this.auth.homeForRole(this.session.user()?.role)]);
  }
}

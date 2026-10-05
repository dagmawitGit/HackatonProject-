import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { apiError } from '../../core/api-error';
import { LanguageService } from '../../core/services/language.service';
import { DEMO_ACCOUNTS } from '../../shared/models/models';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-screen">
      <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <p class="eyebrow">EkubCircle</p>
        <h1>{{ lang.t('login') }}</h1>
        <p class="lede">{{ lang.t('ledger') }}</p>
        @if (suspended()) { <p class="banner warn">This account is suspended.</p> }
        @if (error()) { <p class="banner bad">{{ error() }}</p> }

        <label>Email
          <input type="email" formControlName="email" autocomplete="username" />
        </label>
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <small>Email is required and must be valid.</small>
        }

        <label>Password
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>
        @if (form.controls.password.touched && form.controls.password.invalid) {
          <small>Password is required.</small>
        }

        <button class="button" type="submit" [disabled]="busy()">{{ busy() ? 'Signing in...' : lang.t('login') }}</button>
        <p class="fine">New here? <a routerLink="/register">{{ lang.t('register') }}</a></p>

        <div class="quick">
          <p>Demo fill</p>
          @for (account of quick; track account.email) {
            <button type="button" class="ghost" (click)="fill(account.email, account.password)">{{ account.role }} · {{ account.name }}</button>
          }
        </div>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly lang = inject(LanguageService);
  readonly quick = DEMO_ACCOUNTS.filter((account) => ['Organizer', 'Member', 'Admin'].includes(account.role)).filter((account, index, list) =>
    list.findIndex((item) => item.role === account.role) === index);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly suspended = signal(this.route.snapshot.queryParamMap.get('suspended') === '1');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  fill(email: string, password: string): void {
    this.form.setValue({ email, password });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (auth) => {
        this.busy.set(false);
        void this.router.navigate([this.auth.homeForRole(auth.user.role)]);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(apiError(err));
      },
    });
  }
}

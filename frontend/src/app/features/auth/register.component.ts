import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { apiError } from '../../core/api-error';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-screen">
      <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <p class="eyebrow">EkubCircle</p>
        <h1>{{ lang.t('register') }}</h1>
        <p class="lede">Join as a member, or register as an organizer to keep a circle's ledger.</p>
        @if (error()) { <p class="banner bad">{{ error() }}</p> }

        <label>Full name
          <input formControlName="fullName" />
        </label>
        @if (form.controls.fullName.touched && form.controls.fullName.invalid) { <small>Full name is required.</small> }

        <label>Email
          <input type="email" formControlName="email" />
        </label>
        @if (form.controls.email.touched && form.controls.email.invalid) { <small>Enter a valid email address.</small> }

        <label>Password
          <input type="password" formControlName="password" />
        </label>
        @if (form.controls.password.touched && form.controls.password.invalid) { <small>Password must be at least 8 characters.</small> }

        <label>I am
          <select formControlName="role">
            <option value="Member">A member</option>
            <option value="Organizer">An organizer</option>
          </select>
        </label>

        <button class="button" type="submit" [disabled]="busy()">{{ busy() ? 'Creating account...' : lang.t('register') }}</button>
        <p class="fine">Already registered? <a routerLink="/login">{{ lang.t('login') }}</a></p>
      </form>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly lang = inject(LanguageService);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['Member', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.auth.register(this.form.getRawValue()).subscribe({
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

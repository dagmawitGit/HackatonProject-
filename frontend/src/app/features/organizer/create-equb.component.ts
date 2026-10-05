import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { apiError } from '../../core/api-error';
import { CircleService } from '../../core/services/circle.service';

@Component({
  selector: 'app-create-equb',
  imports: [ReactiveFormsModule],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Organizer</p>
        <h1>Create equb</h1>
        <p class="lede">Name the circle, set the recorded contribution, and choose how often you meet. Nothing is collected yet.</p>
      </div>
    </header>
    <form class="panel form" [formGroup]="form" (ngSubmit)="submit()">
      @if (error()) { <p class="banner bad">{{ error() }}</p> }
      <label>Circle name
        <input formControlName="name" placeholder="Unity Equb" />
      </label>
      @if (form.controls.name.touched && form.controls.name.invalid) { <small>Circle name is required.</small> }

      <label>Contribution amount (ETB)
        <input type="number" min="1" formControlName="contributionAmount" placeholder="25000" />
      </label>
      @if (form.controls.contributionAmount.touched && form.controls.contributionAmount.hasError('required')) { <small>Contribution amount is required.</small> }
      @if (form.controls.contributionAmount.touched && form.controls.contributionAmount.hasError('min')) { <small>Contribution must be greater than 0.</small> }

      <label>Meeting label
        <select formControlName="meetingLabel">
          <option value="Weekly">Weekly</option>
          <option value="Biweekly">Biweekly</option>
          <option value="Monthly">Monthly</option>
        </select>
      </label>
      @if (form.controls.meetingLabel.touched && form.controls.meetingLabel.invalid) { <small>Meeting label is required.</small> }

      <div class="row">
        <button class="button" type="submit" [disabled]="busy()">{{ busy() ? 'Creating...' : 'Create equb' }}</button>
        <button class="ghost" type="button" (click)="demo()">Use Unity Equb demo values</button>
      </div>
    </form>
  `,
})
export class CreateEqubComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CircleService);
  private readonly router = inject(Router);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    contributionAmount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    meetingLabel: ['Monthly', [Validators.required]],
  });

  demo(): void {
    this.form.setValue({ name: 'Unity Equb', contributionAmount: 25000, meetingLabel: 'Monthly' });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.api.create({
      name: raw.name,
      contributionAmount: Number(raw.contributionAmount),
      meetingLabel: raw.meetingLabel,
    }).subscribe({
      next: (circle) => {
        this.busy.set(false);
        void this.router.navigate(['/app/organizer/circles', circle.id, 'members']);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(apiError(err));
      },
    });
  }
}

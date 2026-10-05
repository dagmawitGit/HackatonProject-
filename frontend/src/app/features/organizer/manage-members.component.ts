import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { apiError } from '../../core/api-error';
import { CircleService } from '../../core/services/circle.service';
import { CircleNavComponent } from '../circle/circle-nav.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { Circle, Member } from '../../shared/models/models';
import { DEMO_ACCOUNTS } from '../../shared/models/models';

@Component({
  selector: 'app-manage-members',
  imports: [ReactiveFormsModule, RouterLink, CircleNavComponent, StatusBadgeComponent],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Organizer</p>
        <h1>Manage members</h1>
        <p class="lede">Add people by the email they registered with. The list order is the payout order.</p>
      </div>
    </header>
    <app-circle-nav [id]="id" />
    @if (loading()) { <p class="state">Loading members...</p> }
    @else if (loadError()) { <p class="state bad">{{ loadError() }}</p> }
    @else if (circle()) {
      <article class="panel">
        <div class="row">
          <h2>{{ circle()!.name }}</h2>
          <app-status-badge [status]="circle()!.status" />
        </div>
        @if (circle()!.status !== 'FORMING') {
          <p class="banner warn">Members, contribution, and payout order are locked.</p>
        } @else {
          <form class="inline" [formGroup]="form" (ngSubmit)="add()">
            <label>Member email
              <input type="email" formControlName="email" placeholder="abel@ekubcircle.et" />
            </label>
            <button class="button" type="submit" [disabled]="busy()">Add member</button>
          </form>
          @if (form.controls.email.touched && form.controls.email.invalid) { <small>Enter a valid email address.</small> }
          <div class="quick">
            @for (account of suggestions; track account.email) {
              <button type="button" class="ghost" (click)="form.controls.email.setValue(account.email)">{{ account.name }}</button>
            }
          </div>
        }
        @if (message()) { <p class="banner good">{{ message() }}</p> }
        @if (error()) { <p class="banner bad">{{ error() }}</p> }
        @if (members().length === 0) {
          <p class="state">No members have been added yet. Add the organizer too — they are a member of the equb.</p>
        } @else {
          <ol class="order big">
            @for (member of members(); track member.id; let index = $index) {
              <li>
                <span><strong>Round {{ member.payoutOrder }}</strong> {{ member.fullName }} <small>{{ member.email }}</small></span>
                @if (circle()!.status === 'FORMING') {
                  <span class="row">
                    <button type="button" class="ghost" [disabled]="index === 0" (click)="move(index, -1)">Up</button>
                    <button type="button" class="ghost" [disabled]="index === members().length - 1" (click)="move(index, 1)">Down</button>
                    <button type="button" class="danger" (click)="remove(member)">Remove</button>
                  </span>
                }
              </li>
            }
          </ol>
          @if (circle()!.status === 'FORMING') {
            <a class="button" [routerLink]="['/app/organizer/circles', id, 'start']">Review and start</a>
          }
        }
      </article>
    }
  `,
})
export class ManageMembersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CircleService);
  private readonly fb = inject(FormBuilder);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly suggestions = DEMO_ACCOUNTS.filter((account) => account.role !== 'Admin');
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  readonly circle = signal<Circle | null>(null);
  readonly members = signal<Member[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly error = signal('');
  readonly message = signal('');
  readonly busy = signal(false);

  ngOnInit(): void {
    this.reload();
  }

  add(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.api.addMember(this.id, this.form.controls.email.getRawValue()).subscribe({
      next: (member) => {
        this.busy.set(false);
        this.message.set(`${member.fullName} added at position ${member.payoutOrder}.`);
        this.form.reset();
        this.reload();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(apiError(err));
      },
    });
  }

  remove(member: Member): void {
    if (!confirm(`Remove ${member.fullName} from the equb?`)) return;
    this.api.removeMember(this.id, member.id).subscribe({
      next: () => {
        this.message.set(`${member.fullName} removed.`);
        this.reload();
      },
      error: (err: unknown) => this.error.set(apiError(err)),
    });
  }

  move(index: number, direction: number): void {
    const next = [...this.members()];
    const target = index + direction;
    const current = next[index];
    const swap = next[target];
    if (!current || !swap) return;
    next[index] = swap;
    next[target] = current;
    this.api.reorder(this.id, next.map((member) => member.id)).subscribe({
      next: (members) => {
        this.members.set(members);
        this.message.set('Payout order updated.');
      },
      error: (err: unknown) => this.error.set(apiError(err)),
    });
  }

  private reload(): void {
    forkJoin({ circle: this.api.get(this.id), members: this.api.members(this.id) }).subscribe({
      next: ({ circle, members }) => {
        this.circle.set(circle);
        this.members.set(members);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loadError.set(apiError(err));
        this.loading.set(false);
      },
    });
  }
}

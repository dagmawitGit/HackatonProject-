import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [attr.data-status]="status">{{ label || status }}</span>`,
})
export class StatusBadgeComponent {
  @Input({ required: true }) status = '';
  @Input() label = '';
}

import { Component } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: '<span><ng-content /></span>'
})
export class StatusBadgeComponent {}

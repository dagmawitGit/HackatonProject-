import { Component } from '@angular/core';

@Component({
  selector: 'app-alert',
  standalone: true,
  template: '<div role="status"><ng-content /></div>'
})
export class AlertComponent {}

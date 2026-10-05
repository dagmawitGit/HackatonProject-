import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: '<span role="status" aria-label="Loading"><ng-content /></span>'
})
export class LoadingSpinnerComponent {}

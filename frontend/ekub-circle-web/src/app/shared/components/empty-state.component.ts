import { Component } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: '<section><ng-content /></section>'
})
export class EmptyStateComponent {}

import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  template: '<main><h1>{{ title }}</h1><p>This page is a placeholder.</p></main>'
})
export class AuthPageComponent {
  readonly title = inject(ActivatedRoute).snapshot.data['title'] as string;
}

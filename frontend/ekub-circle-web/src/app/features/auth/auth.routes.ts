import { Routes } from '@angular/router';
import { AuthPageComponent } from './components/auth-page.component';

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: AuthPageComponent, data: { title: 'Login' } },
  { path: 'register', component: AuthPageComponent, data: { title: 'Register' } }
];

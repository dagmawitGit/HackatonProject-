import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthSession, LoginRequest } from '../models/auth-session';
import { AuthUser } from '../models/auth-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  login(_request: LoginRequest): Observable<AuthSession> {
    return throwError(() => new Error('Authentication has not been implemented.'));
  }

  logout(): void {
    throw new Error('Authentication has not been implemented.');
  }

  currentUser(): AuthUser | null {
    return null;
  }

  accessToken(): string | null {
    return null;
  }
}

import { Injectable, signal } from '@angular/core';
import { AuthResponse, UserProfile } from '../../shared/models/models';

const TOKEN_KEY = 'ekub-token';
const USER_KEY = 'ekub-user';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly user = signal<UserProfile | null>(this.readUser());

  set(auth: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    this.token.set(auth.token);
    this.user.set(auth.user);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
  }

  private readUser(): UserProfile | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }
}

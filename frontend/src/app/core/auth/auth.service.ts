import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL, AuthResponse, UserProfile } from '../../shared/models/models';
import { SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  register(body: { fullName: string; email: string; password: string; role: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, body).pipe(tap((auth) => this.session.set(auth)));
  }

  login(body: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, body).pipe(tap((auth) => this.session.set(auth)));
  }

  me(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${API_URL}/auth/me`).pipe(tap((user) => {
      const token = this.session.token();
      if (token) this.session.set({ token, user });
    }));
  }

  logout(): void {
    this.session.clear();
    void this.router.navigate(['/login']);
  }

  homeForRole(role: string | undefined): string {
    if (role === 'Admin') return '/app/admin/dashboard';
    if (role === 'Organizer') return '/app/organizer/dashboard';
    return '/app/member/dashboard';
  }
}

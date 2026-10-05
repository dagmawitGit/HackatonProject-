import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, AdminCircle, AdminOverview, AuditEntry, CircleReport, UserProfile } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  overview(): Observable<AdminOverview> {
    return this.http.get<AdminOverview>(`${API_URL}/admin/overview`);
  }

  users(search = ''): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${API_URL}/admin/users`, { params: new HttpParams().set('search', search) });
  }

  setUserStatus(id: string, status: string): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${API_URL}/admin/users/${id}/status`, { status });
  }

  circles(search = ''): Observable<AdminCircle[]> {
    return this.http.get<AdminCircle[]>(`${API_URL}/admin/circles`, { params: new HttpParams().set('search', search) });
  }

  setSuspension(id: string, suspended: boolean): Observable<AdminCircle> {
    return this.http.patch<AdminCircle>(`${API_URL}/admin/circles/${id}/suspension`, { suspended });
  }

  reports(): Observable<CircleReport[]> {
    return this.http.get<CircleReport[]>(`${API_URL}/admin/reports`);
  }

  audit(search = '', action = ''): Observable<AuditEntry[]> {
    let params = new HttpParams().set('search', search);
    if (action) params = params.set('action', action);
    return this.http.get<AuditEntry[]>(`${API_URL}/admin/audit-logs`, { params });
  }

  health(): Observable<{ status: string; database: string; moneyMovement: string }> {
    return this.http.get<{ status: string; database: string; moneyMovement: string }>(`${API_URL}/health`);
  }
}

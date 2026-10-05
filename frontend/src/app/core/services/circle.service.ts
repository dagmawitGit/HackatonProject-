import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  API_URL,
  Circle,
  CircleSummary,
  EqubRound,
  Member,
  Notice,
  PaymentRecord,
  PayoutResult,
} from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class CircleService {
  private readonly http = inject(HttpClient);

  list(): Observable<Circle[]> {
    return this.http.get<Circle[]>(`${API_URL}/circles`);
  }

  get(id: string): Observable<Circle> {
    return this.http.get<Circle>(`${API_URL}/circles/${id}`);
  }

  create(body: { name: string; contributionAmount: number; meetingLabel: string }): Observable<Circle> {
    return this.http.post<Circle>(`${API_URL}/circles`, body);
  }

  update(id: string, body: { name: string; contributionAmount: number; meetingLabel: string }): Observable<Circle> {
    return this.http.put<Circle>(`${API_URL}/circles/${id}`, body);
  }

  start(id: string): Observable<Circle> {
    return this.http.post<Circle>(`${API_URL}/circles/${id}/start`, {});
  }

  complete(id: string): Observable<Circle> {
    return this.http.post<Circle>(`${API_URL}/circles/${id}/complete`, {});
  }

  summary(id: string): Observable<CircleSummary> {
    return this.http.get<CircleSummary>(`${API_URL}/circles/${id}/summary`);
  }

  members(id: string): Observable<Member[]> {
    return this.http.get<Member[]>(`${API_URL}/circles/${id}/members`);
  }

  addMember(id: string, email: string): Observable<Member> {
    return this.http.post<Member>(`${API_URL}/circles/${id}/members`, { email });
  }

  removeMember(id: string, memberId: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/circles/${id}/members/${memberId}`);
  }

  reorder(id: string, orderedMemberIds: string[]): Observable<Member[]> {
    return this.http.put<Member[]>(`${API_URL}/circles/${id}/members/order`, { orderedMemberIds });
  }

  rounds(id: string): Observable<EqubRound[]> {
    return this.http.get<EqubRound[]>(`${API_URL}/circles/${id}/rounds`);
  }

  currentRound(id: string): Observable<EqubRound | null> {
    return this.http.get<EqubRound | { round: null; message: string }>(`${API_URL}/circles/${id}/rounds/current`).pipe(
      map((res) => ('roundNumber' in res ? res : null)),
    );
  }

  openNext(id: string): Observable<EqubRound> {
    return this.http.post<EqubRound>(`${API_URL}/circles/${id}/rounds/next`, {});
  }

  recordPayment(roundId: string, circleMemberId: string): Observable<PaymentRecord> {
    return this.http.post<PaymentRecord>(`${API_URL}/rounds/${roundId}/payments`, { circleMemberId });
  }

  circlePayments(id: string): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(`${API_URL}/circles/${id}/payments`);
  }

  payout(roundId: string): Observable<PayoutResult> {
    return this.http.post<PayoutResult>(`${API_URL}/rounds/${roundId}/payout`, {});
  }

  notifications(): Observable<Notice[]> {
    return this.http.get<Notice[]>(`${API_URL}/notifications`);
  }
}

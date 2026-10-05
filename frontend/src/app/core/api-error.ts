import { HttpErrorResponse } from '@angular/common/http';

export function apiError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body: unknown = err.error;
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
    }
    if (err.status === 0) return 'Cannot reach the EkubCircle API. Start the backend on port 5080.';
    if (err.status === 401) return 'Email or password is incorrect.';
    if (err.status === 403) return 'You are not allowed to do that.';
  }
  return 'Something went wrong. Please try again.';
}

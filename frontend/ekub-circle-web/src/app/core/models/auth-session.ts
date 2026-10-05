import { AuthUser } from './auth-user';

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

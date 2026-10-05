import { UserRole } from './user-role';

export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
}

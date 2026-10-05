export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface Circle {
  id: string;
  name: string;
  contributionAmount: number;
  meetingLabel: string;
  status: string;
  isSuspended: boolean;
  organizerId: string;
  organizerName: string;
  memberCount: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface Integrity {
  allMembersVerified: boolean;
  paymentRecordsComplete: boolean;
  receiverFromFixedOrder: boolean;
  noDuplicatePayout: boolean;
  currentRoundValid: boolean;
}

export interface CircleSummary {
  memberCount: number;
  contributionAmount: number;
  paidCount: number;
  currentPot: number;
  expectedPot: number;
  currentRound: number | null;
  totalRounds: number;
  receivedCount: number;
  remainingReceivers: number;
  paymentPercentage: number;
  completionPercentage: number;
  currentReceiver: string | null;
  currentReceiverMemberId: string | null;
  circleStatus: string;
  roundStatus: string | null;
  payoutReady: boolean;
  isSuspended: boolean;
  waitingFor: string[];
  nextReceivers: string[];
  integrity: Integrity;
}

export interface Member {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  payoutOrder: number;
  hasReceived: boolean;
  userStatus: string;
  joinedAt: string;
  paidCurrentRound: boolean;
}

export interface EqubRound {
  id: string;
  circleId: string;
  roundNumber: number;
  receiverMemberId: string;
  receiverName: string;
  status: string;
  openedAt: string | null;
  paidOutAt: string | null;
  payoutAmount: number | null;
  paidCount: number;
  memberCount: number;
}

export interface ContributionRecord {
  id: string;
  roundId: string;
  roundNumber: number;
  circleMemberId: string;
  memberName: string;
  payoutOrder: number;
  hasReceived: boolean;
  amount: number;
  status: string;
  recordedAt: string;
  recordedByName: string;
}

export interface PayoutResult {
  roundId: string;
  roundNumber: number;
  receiverMemberId: string;
  receiverName: string;
  amount: number;
  status: string;
  circleCompleted: boolean;
  message: string;
}

export interface Notice {
  id: string;
  action: string;
  description: string;
  createdAt: string;
}

export interface AdminOverview {
  userCount: number;
  activeUserCount: number;
  suspendedUserCount: number;
  circleCount: number;
  formingCount: number;
  activeCircleCount: number;
  completedCount: number;
  suspendedCircleCount: number;
  recordedContributions: number;
  recordedPayouts: number;
  auditEventCount: number;
  databaseConnected: boolean;
}

export interface AdminCircle {
  id: string;
  name: string;
  status: string;
  isSuspended: boolean;
  contributionAmount: number;
  meetingLabel: string;
  organizerName: string;
  organizerEmail: string;
  memberCount: number;
  createdAt: string;
}

export interface CircleReport {
  circleId: string;
  circleName: string;
  status: string;
  isSuspended: boolean;
  organizerName: string;
  memberCount: number;
  receivedCount: number;
  contributionAmount: number;
  totalRecordedPayments: number;
  totalPayouts: number;
}

export interface AuditEntry {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  createdAt: string;
}

export const API_URL = 'http://localhost:5080/api';

export const DEMO_ACCOUNTS = [
  { role: 'Organizer', name: 'Hana Bekele', email: 'hana@ekubcircle.et', password: 'Organizer@123' },
  { role: 'Member', name: 'Abel Tesfaye', email: 'abel@ekubcircle.et', password: 'Member@123' },
  { role: 'Member', name: 'Ruth Alemu', email: 'ruth@ekubcircle.et', password: 'Member@123' },
  { role: 'Member', name: 'Samuel Desta', email: 'samuel@ekubcircle.et', password: 'Member@123' },
  { role: 'Member', name: 'Meron Girma', email: 'meron@ekubcircle.et', password: 'Member@123' },
  { role: 'Member', name: 'Dawit Kebede', email: 'dawit@ekubcircle.et', password: 'Member@123' },
  { role: 'Admin', name: 'Platform Admin', email: 'admin@ekubcircle.et', password: 'Admin@12345' },
];

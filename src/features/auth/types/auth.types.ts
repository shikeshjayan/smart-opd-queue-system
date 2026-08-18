export type UserRole =
  | "patient"
  | "doctor"
  | "clinical_staff"
  | "receptionist"
  | "hospital_admin"
  | "district_admin"
  | "state_admin";

export type UserScope = {
  stateId?: string;
  districtId?: string;
  hospitalId?: string;
  departmentId?: string;
};

export type SessionUser = {
  id: string;
  name: string;
  role: UserRole;
  scope: UserScope;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthState = {
  status: AuthStatus;
  user: SessionUser | null;
  expired: boolean;
};

export type PersistedSession = {
  user: SessionUser;
  issuedAt: string;
  expiresAt: string;
};

export type MockCredential = {
  identifier: string;
  password?: string;
};

export const SESSION_STORAGE_KEY = "smart-health.session";
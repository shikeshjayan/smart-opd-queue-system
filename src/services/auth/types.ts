import type { PersistedSession, SessionUser } from "@/features/auth/types/auth.types";

export type { PersistedSession, SessionUser };

export type MockAccount = {
  user: SessionUser;
  staffPassword?: string;
  patientPhone?: string;
  hint: string;
};

export type LoginPending = {
  pending: true;
  identifier: string;
  name?: string;
};

export type SessionResult = {
  session: PersistedSession | null;
  reason?: "expired" | "missing";
};
import type { PersistedSession, SessionUser, UserRole } from "@/features/auth/types/auth.types";
import { SESSION_STORAGE_KEY } from "@/features/auth/types/auth.types";
import { AUTH_COOKIE, env } from "@/config/app";
import { auditService } from "@/services/security";
import { securityService } from "@/services/security";
import type { LoginPending, MockAccount, SessionResult } from "./types";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

const DEMO_ACCOUNTS: MockAccount[] = [
  {
    user: { id: "P10294", name: "Rahul K", role: "patient", scope: {} },
    patientPhone: "+91 98470 12345",
    hint: "Patient — Rahul K (phone +91 98470 12345)",
  },
  {
    user: {
      id: "doc_001",
      name: "Dr. Anil Kumar",
      role: "doctor",
      scope: {
        stateId: "kerala",
        districtId: "ernakulam",
        hospitalId: "hos_001",
        departmentId: "dep_001",
      },
    },
    staffPassword: "doctor123",
    hint: "Doctor — doc_001 (Cardiology, GH Ernakulam)",
  },
  {
    user: {
      id: "stf_001",
      name: "Radhika Menon",
      role: "receptionist",
      scope: { stateId: "kerala", districtId: "ernakulam", hospitalId: "hos_001" },
    },
    staffPassword: "recept123",
    hint: "Receptionist — stf_001 (GH Ernakulam)",
  },
  {
    user: {
      id: "stf_002",
      name: "Sindhu Thomas",
      role: "clinical_staff",
      scope: { stateId: "kerala", districtId: "ernakulam", hospitalId: "hos_001" },
    },
    staffPassword: "nurse123",
    hint: "Nurse (Clinical Staff) — stf_002 (GH Ernakulam)",
  },
  {
    user: {
      id: "lab_001",
      name: "Sneha Nair",
      role: "lab_staff",
      scope: { stateId: "kerala", districtId: "ernakulam", hospitalId: "hos_001" },
    },
    staffPassword: "lab123",
    hint: "Lab Staff — lab_001 (GH Ernakulam Laboratory)",
  },
  {
    user: {
      id: "adm_001",
      name: "Dr. Sreeja Nambiar",
      role: "hospital_admin",
      scope: { stateId: "kerala", districtId: "ernakulam", hospitalId: "hos_001" },
    },
    staffPassword: "admin123",
    hint: "Hospital Admin — adm_001 (GH Ernakulam)",
  },
  {
    user: {
      id: "dadm_001",
      name: "K. P. Vishwanath",
      role: "district_admin",
      scope: { stateId: "kerala", districtId: "ernakulam" },
    },
    staffPassword: "district123",
    hint: "District Admin — dadm_001 (Ernakulam)",
  },
  {
    user: {
      id: "sadm_001",
      name: "Dr. A. Radhakrishnan",
      role: "state_admin",
      scope: { stateId: "kerala" },
    },
    staffPassword: "state123",
    hint: "State Admin — sadm_001 (Kerala)",
  },
];

function normalize(identifier: string): string {
  return identifier.replace(/[\s-]/g, "").toLowerCase();
}

function buildSession(user: SessionUser): PersistedSession {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + SESSION_DURATION_MS);
  return {
    user,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

function persist(session: PersistedSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

  // Write cookie mirror for Next.js middleware
  const payload = btoa(JSON.stringify({ role: session.user.role, id: session.user.id }));
  document.cookie = `${AUTH_COOKIE}=${payload}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`;
}

export function readPersistedSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

export function clearPersistedSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);

  // Clear cookie mirror
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

function findPatientByPhone(phone: string): MockAccount | undefined {
  return DEMO_ACCOUNTS.find(
    (account) =>
      account.user.role === "patient" &&
      account.patientPhone &&
      normalize(account.patientPhone) === normalize(phone)
  );
}

function findStaffById(staffId: string): MockAccount | undefined {
  return DEMO_ACCOUNTS.find(
    (account) => account.user.role !== "patient" && account.user.id.toLowerCase() === normalize(staffId)
  );
}

export const authService = {
  listDemoAccounts(): Pick<MockAccount, "user" | "hint">[] {
    return DEMO_ACCOUNTS.map(({ user, hint }) => ({ user, hint }));
  },

  requestPatientOtp(phone: string): LoginPending {
    const account = findPatientByPhone(phone);
    if (!account) {
      return { pending: true, identifier: phone };
    }
    return { pending: true, identifier: phone, name: account.user.name };
  },

  verifyPatientOtp(phone: string, otp: string): PersistedSession | null {
    if (env.NODE_ENV === "production" && env.NEXT_PUBLIC_ENABLE_DEMO_MODE !== "true") {
      return null;
    }
    const account = findPatientByPhone(phone);
    if (!account || otp.trim() !== "123456") {
      securityService.record({
        type: "failed_login",
        severity: "warning",
        message: `Failed OTP verification for ${phone}.`,
      });
      auditService.log({
        actorId: account?.user.id ?? "unknown",
        actorName: account?.user.name ?? "Unknown",
        actorRole: "patient",
        action: "LOGIN",
        resourceType: "Session",
        resourceId: phone,
        result: "failure",
      });
      return null;
    }
    const session = buildSession(account.user);
    persist(session);
    auditService.log({
      actorId: account.user.id,
      actorName: account.user.name,
      actorRole: "patient",
      action: "LOGIN",
      resourceType: "Session",
      resourceId: account.user.id,
      result: "success",
    });
    return session;
  },

  staffLogin(staffId: string, password: string): PersistedSession | null {
    const account = findStaffById(staffId);
    if (!account || account.staffPassword !== password) {
      securityService.record({
        type: "failed_login",
        severity: "warning",
        message: `Failed login attempt for staff id “${staffId}”.`,
      });
      auditService.log({
        actorId: staffId,
        actorName: account?.user.name ?? "Unknown",
        actorRole: account?.user.role ?? "-",
        action: "LOGIN",
        resourceType: "Session",
        resourceId: staffId,
        result: "failure",
      });
      return null;
    }
    const session = buildSession(account.user);
    persist(session);
    auditService.log({
      actorId: account.user.id,
      actorName: account.user.name,
      actorRole: account.user.role,
      action: "LOGIN",
      resourceType: "Session",
      resourceId: account.user.id,
      hospitalId: account.user.scope.hospitalId,
      districtId: account.user.scope.districtId,
      result: "success",
    });
    return session;
  },

  demoLogin(role: UserRole): PersistedSession | null {
    if (env.NODE_ENV === "production" && env.NEXT_PUBLIC_ENABLE_DEMO_MODE !== "true") {
      return null;
    }
    const account = DEMO_ACCOUNTS.find((a) => a.user.role === role);
    if (!account) return null;
    const session = buildSession(account.user);
    persist(session);
    auditService.log({
      actorId: account.user.id,
      actorName: account.user.name,
      actorRole: account.user.role,
      action: "LOGIN",
      resourceType: "Session",
      resourceId: account.user.id,
      hospitalId: account.user.scope.hospitalId,
      districtId: account.user.scope.districtId,
      result: "success",
    });
    return session;
  },

  restore(): SessionResult {
    const session = readPersistedSession();
    if (!session) return { session: null, reason: "missing" };
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      clearPersistedSession();
      return { session: null, reason: "expired" };
    }
    return { session };
  },

  extendSession(): PersistedSession | null {
    const session = readPersistedSession();
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      clearPersistedSession();
      return null;
    }
    const extended = buildSession(session.user);
    persist(extended);
    return extended;
  },

  logout(): void {
    const session = readPersistedSession();
    if (session) {
      auditService.log({
        actorId: session.user.id,
        actorName: session.user.name,
        actorRole: session.user.role,
        action: "LOGOUT",
        resourceType: "Session",
        resourceId: session.user.id,
        hospitalId: session.user.scope.hospitalId,
        districtId: session.user.scope.districtId,
        result: "success",
      });
    }
    clearPersistedSession();
  },
};
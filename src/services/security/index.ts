import type { SessionUser } from "@/features/auth/types/auth.types";
import type { AuditEvent } from "@/types/security.types";
import { canAccessDistrict, canAccessHospital } from "@/lib/access-control";

const AUDIT_KEY = "sh.security.audit";
const SECURITY_KEY = "sh.security.events";
const MAX_EVENTS = 500;

export type SecuritySeverity = "info" | "warning" | "critical";

export type SecurityEvent = {
  id: string;
  type: string;
  severity: SecuritySeverity;
  message: string;
  timestamp: string;
  hospitalId?: string;
  districtId?: string;
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

let auditStore: AuditEvent[] = [];
let securityStore: SecurityEvent[] = [];
let hydrated = false;

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  auditStore = read<AuditEvent[]>(AUDIT_KEY, []);
  securityStore = read<SecurityEvent[]>(SECURITY_KEY, []);
  hydrated = true;
}

export type AuditInput = Omit<AuditEvent, "id" | "timestamp">;

export const auditService = {
  log(input: AuditInput): AuditEvent | null {
    hydrate();
    const event: AuditEvent = {
      ...input,
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };
    auditStore.unshift(event);
    if (auditStore.length > MAX_EVENTS) auditStore.length = MAX_EVENTS;
    write(AUDIT_KEY, auditStore);
    return event;
  },

  query(
    filters: Partial<Pick<AuditEvent, "actorId" | "action" | "result" | "hospitalId" | "districtId">> & {
      dateFrom?: string;
      dateTo?: string;
      query?: string;
    } = {}
  ): AuditEvent[] {
    hydrate();
    return auditStore.filter((event) => {
      if (filters.actorId && event.actorId !== filters.actorId) return false;
      if (filters.action && event.action !== filters.action) return false;
      if (filters.result && event.result !== filters.result) return false;
      if (filters.hospitalId && event.hospitalId !== filters.hospitalId) return false;
      if (filters.districtId && event.districtId !== filters.districtId) return false;
      if (filters.dateFrom && event.timestamp < filters.dateFrom) return false;
      if (filters.dateTo && event.timestamp > `${filters.dateTo}T23:59:59.999`) return false;
      if (
        filters.query &&
        !`${event.actorName} ${event.resourceType} ${event.resourceId} ${event.action}`
          .toLowerCase()
          .includes(filters.query.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  },

  visibleTo(user: SessionUser): AuditEvent[] {
    hydrate();
    if (user.role === "state_admin") return auditStore;
    if (user.role === "district_admin") {
      return auditStore.filter((e) => e.districtId === user.scope.districtId);
    }
    return auditStore.filter((e) => e.hospitalId === user.scope.hospitalId);
  },
};

export const securityService = {
  record(
    input: Omit<SecurityEvent, "id" | "timestamp"> & { timestamp?: string }
  ): SecurityEvent | null {
    hydrate();
    const event: SecurityEvent = {
      ...input,
      id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: input.timestamp ?? new Date().toISOString(),
    };
    securityStore.unshift(event);
    if (securityStore.length > MAX_EVENTS) securityStore.length = MAX_EVENTS;
    write(SECURITY_KEY, securityStore);
    return event;
  },

  list(): SecurityEvent[] {
    hydrate();
    return [...securityStore];
  },

  listVisibleTo(user: SessionUser): SecurityEvent[] {
    hydrate();
    return securityStore.filter((event) => {
      if (user.role === "state_admin") return true;
      if (user.role === "district_admin") return event.districtId === user.scope.districtId;
      return canAccessHospital(user, event.hospitalId ?? "") && !!event.hospitalId;
    });
  },

  canView(user: SessionUser): boolean {
    return ["hospital_admin", "district_admin", "state_admin"].includes(user.role);
  },

  withinDistrict(user: SessionUser, districtId: string): boolean {
    return canAccessDistrict(user, districtId);
  },
};

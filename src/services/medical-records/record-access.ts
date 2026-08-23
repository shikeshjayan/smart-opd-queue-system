import type { SessionUser } from "@/features/auth/types/auth.types";

export type RecordAccessEvent = {
  id: string;
  patientId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: "viewed" | "exported" | "created" | "modified" | "deleted";
  resourceType: string;
  resourceId: string;
  hospitalId?: string;
  timestamp: string;
  purpose?: string;
};

const ACCESS_KEY = "sh.record-access";
const MAX_EVENTS = 500;

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

let store: RecordAccessEvent[] = [];

function hydrate(): void {
  if (store.length > 0 || typeof window === "undefined") return;
  store = readStore<RecordAccessEvent[]>(ACCESS_KEY, []);
}

function persist(): void {
  writeStore(ACCESS_KEY, store);
}

export const recordAccessService = {
  log(input: Omit<RecordAccessEvent, "id" | "timestamp">): RecordAccessEvent {
    hydrate();
    const event: RecordAccessEvent = {
      ...input,
      id: `ra_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };
    store.unshift(event);
    if (store.length > MAX_EVENTS) store.length = MAX_EVENTS;
    persist();
    return event;
  },

  logAccess(
    patientId: string,
    actor: SessionUser,
    action: RecordAccessEvent["action"],
    resourceType: string,
    resourceId: string,
    purpose?: string
  ): RecordAccessEvent {
    return this.log({
      patientId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      resourceType,
      resourceId,
      hospitalId: actor.scope.hospitalId,
      purpose,
    });
  },

  listForPatient(patientId: string): RecordAccessEvent[] {
    hydrate();
    return store
      .filter((e) => e.patientId === patientId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  listAll(): RecordAccessEvent[] {
    hydrate();
    return [...store].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },
};

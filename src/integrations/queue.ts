import type { IntegrationEvent, IntegrationEventStatus, IntegrationProviderId } from "./types";

const QUEUE_KEY = "sh.integration.queue";
const MAX_EVENTS = 1000;
const MAX_ATTEMPTS = 3;

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

let store: IntegrationEvent[] = [];

function hydrate(): void {
  if (store.length > 0 || typeof window === "undefined") return;
  store = read<IntegrationEvent[]>(QUEUE_KEY, []);
}

function persist(): void {
  write(QUEUE_KEY, store);
}

function nextRetryDelay(attempts: number): number {
  const delays = [60_000, 300_000, 900_000];
  return delays[Math.min(attempts, delays.length - 1)];
}

export const integrationQueue = {
  enqueue(
    event: Omit<IntegrationEvent, "id" | "attempts" | "status" | "createdAt" | "updatedAt" | "maxAttempts">
  ): IntegrationEvent | null {
    hydrate();

    if (store.some((e) => e.idempotencyKey === event.idempotencyKey && e.status !== "failed")) {
      return null;
    }

    const now = new Date().toISOString();
    const entry: IntegrationEvent = {
      ...event,
      id: `int_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    store.unshift(entry);
    if (store.length > MAX_EVENTS) store.length = MAX_EVENTS;
    persist();
    return entry;
  },

  list(filters: { provider?: IntegrationProviderId; status?: IntegrationEventStatus } = {}): IntegrationEvent[] {
    hydrate();
    return store.filter((e) => {
      if (filters.provider && e.provider !== filters.provider) return false;
      if (filters.status && e.status !== filters.status) return false;
      return true;
    });
  },

  get(eventId: string): IntegrationEvent | undefined {
    hydrate();
    return store.find((e) => e.id === eventId);
  },

  getByResource(resourceId: string): IntegrationEvent[] {
    hydrate();
    return store.filter((e) => e.resourceId === resourceId);
  },

  existsByKey(key: string): boolean {
    hydrate();
    return store.some((e) => e.idempotencyKey === key && e.status !== "failed");
  },

  markProcessing(id: string): void {
    hydrate();
    const event = store.find((e) => e.id === id);
    if (event) {
      event.status = "processing";
      event.updatedAt = new Date().toISOString();
      persist();
    }
  },

  markCompleted(id: string): void {
    hydrate();
    const event = store.find((e) => e.id === id);
    if (event) {
      event.status = "completed";
      event.completedAt = new Date().toISOString();
      event.updatedAt = event.completedAt;
      persist();
    }
  },

  markFailed(id: string, reason: string): void {
    hydrate();
    const event = store.find((e) => e.id === id);
    if (event) {
      event.attempts += 1;
      event.failedReason = reason;
      event.updatedAt = new Date().toISOString();

      if (event.attempts >= event.maxAttempts) {
        event.status = "failed";
      } else {
        event.status = "pending";
        event.nextRetryAt = new Date(Date.now() + nextRetryDelay(event.attempts)).toISOString();
      }
      persist();
    }
  },

  getRetriable(): IntegrationEvent[] {
    hydrate();
    const now = Date.now();
    return store.filter(
      (e) =>
        (e.status === "pending" && e.attempts < e.maxAttempts) ||
        (e.status === "failed" && e.attempts < e.maxAttempts && e.nextRetryAt && new Date(e.nextRetryAt).getTime() <= now)
    );
  },

  stats(): { total: number; pending: number; processing: number; completed: number; failed: number } {
    hydrate();
    return {
      total: store.length,
      pending: store.filter((e) => e.status === "pending").length,
      processing: store.filter((e) => e.status === "processing").length,
      completed: store.filter((e) => e.status === "completed").length,
      failed: store.filter((e) => e.status === "failed").length,
    };
  },
};

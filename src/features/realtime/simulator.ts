import { GRACE_PERIOD_MINUTES } from "../queue/config";
import { queueMockApi } from "../queue/api/queue.mock";

export type AutoAdvanceOptions = {
  intervalMs?: number;
  gracePeriodMinutes?: number;
};

let timer: ReturnType<typeof setInterval> | null = null;
let advancing = false;
let intervalMs = 8000;
let gracePeriodMs = GRACE_PERIOD_MINUTES * 60_000;
const calledAt = new Map<string, number>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function isAutoAdvancing(): boolean {
  return timer !== null;
}

export function onAutoAdvanceChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function startAutoAdvance(opdId: string, options: AutoAdvanceOptions = {}) {
  if (timer !== null) stopAutoAdvance();
  intervalMs = options.intervalMs ?? 8000;
  gracePeriodMs = (options.gracePeriodMinutes ?? GRACE_PERIOD_MINUTES) * 60_000;
  timer = setInterval(() => {
    void tick(opdId);
  }, intervalMs);
  notify();
}

export function stopAutoAdvance() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  calledAt.clear();
  notify();
}

async function tick(opdId: string) {
  if (advancing) return;
  advancing = true;
  try {
    const snapshot = await queueMockApi.getDoctorQueue(opdId);
    const now = Date.now();

    if (!snapshot.current) {
      if (snapshot.next) {
        const entry = await queueMockApi.callNext(opdId);
        if (entry) calledAt.set(entry.tokenNumber, now);
      }
      return;
    }

    const tokenNumber = snapshot.current.tokenNumber;

    if (snapshot.current.status === "called") {
      const sinceCalled = now - (calledAt.get(tokenNumber) ?? now);
      if (sinceCalled >= gracePeriodMs) {
        await queueMockApi.skip(tokenNumber);
        calledAt.delete(tokenNumber);
      } else {
        await queueMockApi.startConsultation(tokenNumber);
      }
      return;
    }

    if (snapshot.current.status === "in_consultation") {
      await queueMockApi.completeToken(tokenNumber);
      calledAt.delete(tokenNumber);
    }
  } finally {
    advancing = false;
  }
}

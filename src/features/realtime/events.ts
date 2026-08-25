import type { OpsEventType, QueueEvent, QueueEventType, RealtimeEvent, SessionEventType } from "./types/realtime.types";

export const QUEUE_EVENT_TYPES: Record<QueueEventType, QueueEventType> = {
  TOKEN_CALLED: "TOKEN_CALLED",
  TOKEN_STARTED: "TOKEN_STARTED",
  TOKEN_COMPLETED: "TOKEN_COMPLETED",
  TOKEN_SKIPPED: "TOKEN_SKIPPED",
  TOKEN_CANCELLED: "TOKEN_CANCELLED",
  PRIORITY_CHANGED: "PRIORITY_CHANGED",
  QUEUE_UPDATED: "QUEUE_UPDATED",
};

export const QUEUE_EVENT_NAMES = new Set<string>(Object.values(QUEUE_EVENT_TYPES));

export function isQueueEvent(event: RealtimeEvent): event is QueueEvent & { opdId: string } {
  return QUEUE_EVENT_NAMES.has(event.type);
}

export function isNotificationEvent(event: RealtimeEvent): event is { type: "NOTIFICATION_EVENT"; at: string; userId?: string; hospitalId?: string } {
  return event.type === "NOTIFICATION_EVENT";
}

export function isQueueEventType(type: string): type is QueueEventType {
  return QUEUE_EVENT_NAMES.has(type);
}

export const SESSION_EVENT_TYPES: Record<SessionEventType, SessionEventType> = {
  SESSION_OPENED: "SESSION_OPENED",
  SESSION_ACTIVATED: "SESSION_ACTIVATED",
  SESSION_PAUSED: "SESSION_PAUSED",
  SESSION_RESUMED: "SESSION_RESUMED",
  SESSION_COMPLETED: "SESSION_COMPLETED",
  SESSION_CANCELLED: "SESSION_CANCELLED",
};

export const SESSION_EVENT_NAMES = new Set<string>(Object.values(SESSION_EVENT_TYPES));

export function isSessionEvent(event: RealtimeEvent): event is Extract<RealtimeEvent, { type: SessionEventType }> {
  return SESSION_EVENT_NAMES.has(event.type);
}

export const OPS_EVENT_NAMES = new Set<OpsEventType>([
  "STAFF_LEAVE_APPROVED",
  "CLOSURE_CREATED",
  "CAPACITY_CHANGED",
]);

export function isOpsEvent(event: RealtimeEvent): event is Extract<RealtimeEvent, { type: OpsEventType }> {
  return OPS_EVENT_NAMES.has(event.type as OpsEventType);
}

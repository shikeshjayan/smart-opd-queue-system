import type { QueueEvent, QueueEventType, RealtimeEvent } from "./types/realtime.types";

export const QUEUE_EVENT_TYPES: Record<QueueEventType, QueueEventType> = {
  TOKEN_CALLED: "TOKEN_CALLED",
  TOKEN_STARTED: "TOKEN_STARTED",
  TOKEN_COMPLETED: "TOKEN_COMPLETED",
  TOKEN_SKIPPED: "TOKEN_SKIPPED",
  TOKEN_CANCELLED: "TOKEN_CANCELLED",
  QUEUE_UPDATED: "QUEUE_UPDATED",
};

export const QUEUE_EVENT_NAMES = new Set<string>(Object.values(QUEUE_EVENT_TYPES));

export function isQueueEvent(event: RealtimeEvent): event is QueueEvent {
  return QUEUE_EVENT_NAMES.has(event.type);
}

export function isQueueEventType(type: string): type is QueueEventType {
  return QUEUE_EVENT_NAMES.has(type);
}

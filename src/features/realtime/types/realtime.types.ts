import type { QueuePriority } from "@/types";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

export type QueueEventType =
  | "TOKEN_CALLED"
  | "TOKEN_STARTED"
  | "TOKEN_COMPLETED"
  | "TOKEN_SKIPPED"
  | "TOKEN_CANCELLED"
  | "PRIORITY_CHANGED"
  | "QUEUE_UPDATED";

type QueueEventBase = {
  type: QueueEventType;
  opdId: string;
  tokenId?: string;
  tokenNumber?: string;
  at: string;
};

export type TokenCalledEvent = QueueEventBase & {
  type: "TOKEN_CALLED";
  tokenNumber: string;
  message: string;
};

export type TokenStartedEvent = QueueEventBase & {
  type: "TOKEN_STARTED";
  tokenNumber: string;
};

export type TokenCompletedEvent = QueueEventBase & {
  type: "TOKEN_COMPLETED";
  tokenNumber: string;
};

export type TokenSkippedEvent = QueueEventBase & {
  type: "TOKEN_SKIPPED";
  tokenNumber: string;
};

export type TokenCancelledEvent = QueueEventBase & {
  type: "TOKEN_CANCELLED";
  tokenNumber: string;
};

export type QueueUpdatedEvent = QueueEventBase & {
  type: "QUEUE_UPDATED";
};

export type PriorityChangedEvent = QueueEventBase & {
  type: "PRIORITY_CHANGED";
  tokenNumber: string;
  level: QueuePriority;
};

export type QueueEvent =
  | TokenCalledEvent
  | TokenStartedEvent
  | TokenCompletedEvent
  | TokenSkippedEvent
  | TokenCancelledEvent
  | PriorityChangedEvent
  | QueueUpdatedEvent;

/* ───────── Clinical workflow events (Phase 24, §28) ───────── */

type ClinicalEventBase = {
  at: string;
  hospitalId?: string;
  actorId?: string;
};

export type LabEventType =
  | "LAB_ORDER_CREATED"
  | "SAMPLE_COLLECTED"
  | "LAB_RESULT_SUBMITTED"
  | "LAB_RESULT_VERIFIED"
  | "CRITICAL_RESULT_DETECTED";

export type PharmacyEventType =
  | "PRESCRIPTION_CREATED"
  | "PRESCRIPTION_READY"
  | "PRESCRIPTION_PARTIALLY_DISPENSED"
  | "PRESCRIPTION_DISPENSED"
  | "LOW_STOCK_DETECTED"
  | "EXPIRY_ALERT";

export type DiagnosticEventType =
  | "DIAGNOSTIC_ORDER_CREATED"
  | "DIAGNOSTIC_COMPLETED"
  | "REPORT_VERIFIED";

export type LabEvent = ClinicalEventBase & {
  type: LabEventType;
  orderId: string;
  patientId?: string;
};

export type PharmacyEvent = ClinicalEventBase & {
  type: PharmacyEventType;
  prescriptionId?: string;
  medicineId?: string;
};

export type DiagnosticEvent = ClinicalEventBase & {
  type: DiagnosticEventType;
  orderId: string;
};

export type ClinicalEvent = LabEvent | PharmacyEvent | DiagnosticEvent;

export type NotificationChangeEvent = {
  type: "NOTIFICATION_EVENT";
  at: string;
  userId?: string;
  hospitalId?: string;
};

export type ConnectionChangedEvent = {
  type: "CONNECTION_CHANGED";
  status: ConnectionStatus;
  at: string;
};

export type RealtimeEvent = (QueueEvent & { opdId: string }) | ClinicalEvent | NotificationChangeEvent | ConnectionChangedEvent;

export type RealtimeListener = (event: RealtimeEvent) => void;

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

export type QueueEventType =
  | "TOKEN_CALLED"
  | "TOKEN_STARTED"
  | "TOKEN_COMPLETED"
  | "TOKEN_SKIPPED"
  | "TOKEN_CANCELLED"
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

export type QueueEvent =
  | TokenCalledEvent
  | TokenStartedEvent
  | TokenCompletedEvent
  | TokenSkippedEvent
  | TokenCancelledEvent
  | QueueUpdatedEvent;

export type ConnectionChangedEvent = {
  type: "CONNECTION_CHANGED";
  status: ConnectionStatus;
  at: string;
};

export type RealtimeEvent = QueueEvent | ConnectionChangedEvent;

export type RealtimeListener = (event: RealtimeEvent) => void;

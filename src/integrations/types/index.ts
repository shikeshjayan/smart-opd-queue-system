export type IntegrationProviderId =
  | "identity"
  | "health-record"
  | "laboratory"
  | "pharmacy"
  | "notification"
  | "reporting";

export type IntegrationStatus = "healthy" | "degraded" | "down" | "disconnected";

export type IntegrationEventStatus = "pending" | "processing" | "completed" | "failed";

export type IntegrationEvent = {
  id: string;
  type: string;
  resourceId: string;
  provider: IntegrationProviderId;
  status: IntegrationEventStatus;
  attempts: number;
  maxAttempts: number;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedReason?: string;
  nextRetryAt?: string;
};

export type IntegrationProvider = {
  id: IntegrationProviderId;
  name: string;
  version: string;
  status: IntegrationStatus;
  lastHealthyAt?: string;
  sync(event: IntegrationEvent): Promise<{ success: boolean; message?: string }>;
  health(): Promise<IntegrationStatus>;
};

export type PatientIdentityRef = {
  provider: string;
  externalId: string;
  verifiedAt?: string;
};

export type FieldMapping = {
  internal: string;
  external: string;
  transform?: "none" | "date_iso" | "enum_map";
};

export type DataMapper = {
  providerId: IntegrationProviderId;
  entityType: string;
  mappings: FieldMapping[];
};

export type ProviderHealth = {
  providerId: IntegrationProviderId;
  name: string;
  status: IntegrationStatus;
  lastSuccessfulSync?: string;
  pendingEvents: number;
  failedEvents: number;
  version: string;
};

export type SecretRef = {
  name: string;
  provider: IntegrationProviderId;
};

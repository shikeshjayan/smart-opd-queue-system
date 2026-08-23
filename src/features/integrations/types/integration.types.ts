import type { IntegrationProviderId, IntegrationStatus } from "@/integrations/types";

export type IntegrationCardData = {
  providerId: IntegrationProviderId;
  name: string;
  version: string;
  status: IntegrationStatus;
  lastSuccessfulSync?: string;
  pendingEvents: number;
  failedEvents: number;
};

export type IntegrationEventRow = {
  id: string;
  type: string;
  resourceId: string;
  provider: IntegrationProviderId;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedReason?: string;
  nextRetryAt?: string;
};

export type IntegrationHealthSummary = {
  totalProviders: number;
  healthyProviders: number;
  totalPending: number;
  totalFailed: number;
  totalCompleted: number;
};

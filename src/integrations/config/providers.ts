import type { IntegrationProviderId } from "../types";

export type ProviderConfig = {
  id: IntegrationProviderId;
  name: string;
  version: string;
  mockEnabled: boolean;
  baseUrl?: string;
  timeoutMs: number;
  maxRetries: number;
};

export const PROVIDER_CONFIGS: Record<IntegrationProviderId, ProviderConfig> = {
  identity: {
    id: "identity",
    name: "Identity Service",
    version: "v1",
    mockEnabled: true,
    timeoutMs: 5000,
    maxRetries: 3,
  },
  "health-record": {
    id: "health-record",
    name: "Health Records",
    version: "v1",
    mockEnabled: true,
    timeoutMs: 10000,
    maxRetries: 3,
  },
  laboratory: {
    id: "laboratory",
    name: "Laboratory",
    version: "v1",
    mockEnabled: true,
    timeoutMs: 10000,
    maxRetries: 3,
  },
  pharmacy: {
    id: "pharmacy",
    name: "Pharmacy",
    version: "v1",
    mockEnabled: true,
    timeoutMs: 5000,
    maxRetries: 3,
  },
  notification: {
    id: "notification",
    name: "Notifications",
    version: "v1",
    mockEnabled: true,
    timeoutMs: 3000,
    maxRetries: 2,
  },
  reporting: {
    id: "reporting",
    name: "Reporting",
    version: "v1",
    mockEnabled: true,
    timeoutMs: 15000,
    maxRetries: 3,
  },
};

export const PROVIDER_LIST = Object.values(PROVIDER_CONFIGS);

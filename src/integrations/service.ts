import type {
  IntegrationEvent,
  IntegrationProvider,
  IntegrationProviderId,
  ProviderHealth,
} from "./types";
import { integrationQueue } from "./queue";
import { PROVIDER_CONFIGS } from "./config/providers";

const providers = new Map<IntegrationProviderId, IntegrationProvider>();

export const integrationService = {
  registerProvider(provider: IntegrationProvider): void {
    providers.set(provider.id, provider);
  },

  getProvider(id: IntegrationProviderId): IntegrationProvider | undefined {
    return providers.get(id);
  },

  enqueueEvent(
    type: string,
    resourceId: string,
    providerId: IntegrationProviderId,
    idempotencyKey?: string
  ): IntegrationEvent | null {
    return integrationQueue.enqueue({
      type,
      resourceId,
      provider: providerId,
      idempotencyKey: idempotencyKey ?? `${providerId}:${resourceId}:${type}`,
    });
  },

  async processEvent(eventId: string): Promise<boolean> {
    const event = integrationQueue.get(eventId);
    if (!event || event.status === "completed") return false;

    const provider = providers.get(event.provider);
    if (!provider) return false;

    integrationQueue.markProcessing(event.id);

    try {
      const result = await provider.sync(event);
      if (result.success) {
        integrationQueue.markCompleted(event.id);
        return true;
      }
      integrationQueue.markFailed(event.id, result.message ?? "Sync failed");
      return false;
    } catch (error) {
      integrationQueue.markFailed(event.id, error instanceof Error ? error.message : "Unknown error");
      return false;
    }
  },

  async processNext(): Promise<boolean> {
    const retriable = integrationQueue.getRetriable();
    if (retriable.length === 0) return false;
    return this.processEvent(retriable[0].id);
  },

  async processAll(): Promise<void> {
    let processed = true;
    while (processed) {
      processed = await this.processNext();
    }
  },

  getHealth(): ProviderHealth[] {
    return Array.from(providers.values()).map((provider) => {
      const events = integrationQueue.list({ provider: provider.id });
      const pending = events.filter((e) => e.status === "pending" || e.status === "processing").length;
      const failed = events.filter((e) => e.status === "failed").length;
      const completed = events.filter((e) => e.status === "completed");
      const lastSync = completed.length > 0 ? completed[0].completedAt : undefined;

      return {
        providerId: provider.id,
        name: provider.name,
        status: provider.status,
        lastSuccessfulSync: lastSync,
        pendingEvents: pending,
        failedEvents: failed,
        version: provider.version,
      };
    });
  },

  getHealthForProvider(providerId: IntegrationProviderId): ProviderHealth | undefined {
    return this.getHealth().find((h) => h.providerId === providerId);
  },

  listEvents(filters: { provider?: IntegrationProviderId; status?: IntegrationEvent["status"] } = {}): IntegrationEvent[] {
    return integrationQueue.list(filters);
  },

  getEventDetail(eventId: string): IntegrationEvent | undefined {
    return integrationQueue.get(eventId);
  },

  getSyncStatus(resourceId: string): "synced" | "pending" | "failed" | "none" {
    const events = integrationQueue.getByResource(resourceId);
    if (events.length === 0) return "none";
    if (events.some((e) => e.status === "completed")) return "synced";
    if (events.some((e) => e.status === "pending" || e.status === "processing")) return "pending";
    if (events.some((e) => e.status === "failed")) return "failed";
    return "none";
  },

  stats() {
    return integrationQueue.stats();
  },
};

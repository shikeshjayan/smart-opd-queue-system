import { integrationService } from "@/integrations/service";
import { initializeProviders } from "@/integrations/providers";
import type { IntegrationProviderId } from "@/integrations/types";
import type { IntegrationCardData, IntegrationEventRow, IntegrationHealthSummary } from "../types/integration.types";

const delay = () => new Promise((resolve) => setTimeout(resolve, 250));

initializeProviders();

export const integrationMockApi = {
  async listProviders(): Promise<IntegrationCardData[]> {
    await delay();
    return integrationService.getHealth().map((h) => ({
      providerId: h.providerId,
      name: h.name,
      version: h.version,
      status: h.status,
      lastSuccessfulSync: h.lastSuccessfulSync,
      pendingEvents: h.pendingEvents,
      failedEvents: h.failedEvents,
    }));
  },

  async getHealthSummary(): Promise<IntegrationHealthSummary> {
    await delay();
    const health = integrationService.getHealth();
    const stats = integrationService.stats();
    return {
      totalProviders: health.length,
      healthyProviders: health.filter((h) => h.status === "healthy").length,
      totalPending: stats.pending,
      totalFailed: stats.failed,
      totalCompleted: stats.completed,
    };
  },

  async listEvents(filters: { provider?: IntegrationProviderId; status?: string } = {}): Promise<IntegrationEventRow[]> {
    await delay();
    return integrationService
      .listEvents(filters as { provider?: IntegrationProviderId })
      .map((e) => ({
        id: e.id,
        type: e.type,
        resourceId: e.resourceId,
        provider: e.provider,
        status: e.status,
        attempts: e.attempts,
        maxAttempts: e.maxAttempts,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        completedAt: e.completedAt,
        failedReason: e.failedReason,
        nextRetryAt: e.nextRetryAt,
      }));
  },

  async getEventDetail(eventId: string): Promise<IntegrationEventRow | undefined> {
    await delay();
    const e = integrationService.getEventDetail(eventId);
    if (!e) return undefined;
    return {
      id: e.id,
      type: e.type,
      resourceId: e.resourceId,
      provider: e.provider,
      status: e.status,
      attempts: e.attempts,
      maxAttempts: e.maxAttempts,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      completedAt: e.completedAt,
      failedReason: e.failedReason,
      nextRetryAt: e.nextRetryAt,
    };
  },

  async processEvent(eventId: string): Promise<boolean> {
    await delay();
    return integrationService.processEvent(eventId);
  },

  async processAll(): Promise<void> {
    await delay();
    await integrationService.processAll();
  },
};

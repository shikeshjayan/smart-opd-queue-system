import type { IntegrationEvent, IntegrationProvider, IntegrationStatus } from "../types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockNotificationProvider implements IntegrationProvider {
  id = "notification" as const;
  name = "Notifications";
  version = "v1";
  status: IntegrationStatus = "healthy";
  lastHealthyAt?: string;

  async sync(_event: IntegrationEvent): Promise<{ success: boolean; message?: string }> {
    await delay(100 + Math.random() * 150);
    if (Math.random() < 0.04) {
      return { success: false, message: "Notification delivery queue backed up" };
    }
    this.lastHealthyAt = new Date().toISOString();
    return { success: true };
  }

  async health(): Promise<IntegrationStatus> {
    return this.status;
  }
}

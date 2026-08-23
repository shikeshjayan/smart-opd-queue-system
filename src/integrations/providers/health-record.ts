import type { IntegrationEvent, IntegrationProvider, IntegrationStatus } from "../types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockHealthRecordProvider implements IntegrationProvider {
  id = "health-record" as const;
  name = "Health Records";
  version = "v1";
  status: IntegrationStatus = "healthy";
  lastHealthyAt?: string;

  async sync(_event: IntegrationEvent): Promise<{ success: boolean; message?: string }> {
    await delay(200 + Math.random() * 300);
    if (Math.random() < 0.08) {
      return { success: false, message: "Health record service temporarily unavailable" };
    }
    this.lastHealthyAt = new Date().toISOString();
    return { success: true };
  }

  async health(): Promise<IntegrationStatus> {
    return this.status;
  }
}

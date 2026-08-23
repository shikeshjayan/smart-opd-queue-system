import type { IntegrationEvent, IntegrationProvider, IntegrationStatus } from "../types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockReportingProvider implements IntegrationProvider {
  id = "reporting" as const;
  name = "Reporting";
  version = "v1";
  status: IntegrationStatus = "healthy";
  lastHealthyAt?: string;

  async sync(_event: IntegrationEvent): Promise<{ success: boolean; message?: string }> {
    await delay(300 + Math.random() * 400);
    if (Math.random() < 0.05) {
      return { success: false, message: "Government reporting endpoint unavailable" };
    }
    this.lastHealthyAt = new Date().toISOString();
    return { success: true };
  }

  async health(): Promise<IntegrationStatus> {
    return this.status;
  }
}

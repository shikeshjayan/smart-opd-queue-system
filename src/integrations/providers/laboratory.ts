import type { IntegrationEvent, IntegrationProvider, IntegrationStatus } from "../types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockLaboratoryProvider implements IntegrationProvider {
  id = "laboratory" as const;
  name = "Laboratory";
  version = "v1";
  status: IntegrationStatus = "healthy";
  lastHealthyAt?: string;

  async sync(_event: IntegrationEvent): Promise<{ success: boolean; message?: string }> {
    await delay(250 + Math.random() * 350);
    if (Math.random() < 0.07) {
      return { success: false, message: "Laboratory integration endpoint unreachable" };
    }
    this.lastHealthyAt = new Date().toISOString();
    return { success: true };
  }

  async health(): Promise<IntegrationStatus> {
    return this.status;
  }
}

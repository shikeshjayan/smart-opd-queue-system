import type { IntegrationEvent, IntegrationProvider, IntegrationStatus } from "../types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockPharmacyProvider implements IntegrationProvider {
  id = "pharmacy" as const;
  name = "Pharmacy";
  version = "v1";
  status: IntegrationStatus = "healthy";
  lastHealthyAt?: string;

  async sync(_event: IntegrationEvent): Promise<{ success: boolean; message?: string }> {
    await delay(150 + Math.random() * 200);
    if (Math.random() < 0.06) {
      return { success: false, message: "Pharmacy system sync delayed" };
    }
    this.lastHealthyAt = new Date().toISOString();
    return { success: true };
  }

  async health(): Promise<IntegrationStatus> {
    return this.status;
  }
}

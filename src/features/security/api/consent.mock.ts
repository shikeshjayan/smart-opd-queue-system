import { consentService } from "@/services/security/consent";
import type { ConsentHistoryEntry, ConsentRecord } from "@/services/security/consent";

export type { ConsentRecord, ConsentHistoryEntry };

const delay = () => new Promise((resolve) => setTimeout(resolve, 250));

export const consentMockApi = {
  async list(patientId: string): Promise<ConsentRecord[]> {
    await delay();
    return consentService.listForPatient(patientId);
  },

  async history(patientId: string): Promise<ConsentHistoryEntry[]> {
    await delay();
    return consentService.historyForPatient(patientId);
  },

  async grant(input: {
    patientId: string;
    purpose: string;
    grantedBy: string;
    scopeNote?: string;
    durationDays?: number;
    requestedBy?: string;
  }): Promise<ConsentRecord> {
    await delay();
    return consentService.grant(input);
  },

  async withdraw(consentId: string, withdrawnBy: string): Promise<ConsentRecord | undefined> {
    await delay();
    return consentService.withdraw(consentId, withdrawnBy, "Patient withdrew access from privacy settings");
  },
};

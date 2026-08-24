import {
  getConsultationContext,
  getActiveEncounterForPatient,
  saveConsultationDraft,
  completeConsultation,
  requestCorrection,
  acquireLock,
  releaseLock,
  listConsultationAudit,
} from "@/server/actions/consultations";
import type { ConsultationSections } from "@/services/consultation/types";
import type { PrescriptionDraftItem } from "@/services/prescription/types";

export const consultationMockApi = {
  getContext: (encounterId: string) => getConsultationContext(encounterId),

  getOrCreateForPatient: (patientId: string) => getActiveEncounterForPatient(patientId),

  saveDraft: (encounterId: string, sections: ConsultationSections) =>
    saveConsultationDraft(encounterId, sections),

  complete: async (
    encounterId: string,
    sections: ConsultationSections,
    _prescriptionItems?: PrescriptionDraftItem[],
    _instructions?: string
  ) => {
    const result = await completeConsultation(encounterId, sections);
    if (!result.ok) {
      throw new Error(result.error ?? "Unable to complete consultation");
    }
    const context = await getConsultationContext(encounterId);
    return { encounter: context?.encounter, context };
  },

  requestCorrection: (encounterId: string, reason: string) =>
    requestCorrection(encounterId, reason),

  acquireLock: (encounterId: string) => acquireLock(encounterId),
  releaseLock: (encounterId: string) => releaseLock(encounterId),
  listAudit: (encounterId: string) => listConsultationAudit(encounterId),
};

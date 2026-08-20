import { consultationService } from "@/services/consultation";
import type { ConsultationSections } from "@/services/consultation/types";
import { prescriptionService } from "@/services/prescription";
import type { PrescriptionDraftItem } from "@/services/prescription/types";
import { doctorMockApi } from "@/features/doctor/api/doctor.mock";
import { appointmentService } from "@/services/appointments";
import type { Encounter } from "@/types";

export const consultationMockApi = {
  getContext: (encounterId: string) => consultationService.getContext(encounterId),
  getOrCreateForPatient: (patientId: string) => consultationService.getOrCreateForPatient(patientId),

  saveDraft: (encounterId: string, sections: ConsultationSections) =>
    consultationService.saveDraft(encounterId, sections),

  async complete(
    encounterId: string,
    sections: ConsultationSections,
    prescriptionItems: PrescriptionDraftItem[],
    instructions?: string
  ): Promise<{ encounter: Encounter | undefined; context: Awaited<ReturnType<typeof consultationService.getContext>> }> {
    const context = await consultationService.getContext(encounterId);
    if (!context) return { encounter: undefined, context: null };

    await consultationService.saveDraft(encounterId, sections);

    if (prescriptionItems.length > 0) {
      await prescriptionService.create(encounterId, {
        patientId: context.encounter.patientId,
        doctorId: context.encounter.doctorId,
        hospitalId: context.encounter.hospitalId,
        doctorName: context.encounter.doctorName,
        hospitalName: context.encounter.hospitalName,
        departmentName: context.encounter.departmentName,
      }, prescriptionItems, instructions);
    }

    const encounter = await consultationService.complete(encounterId);
    await doctorMockApi.completeConsultation(context.encounter.tokenNumber);
    if (encounter) {
      await appointmentService.markCompletedForToken(context.encounter.tokenNumber, encounter.id);
    }
    const fresh = await consultationService.getContext(encounterId);
    return { encounter, context: fresh };
  },
};
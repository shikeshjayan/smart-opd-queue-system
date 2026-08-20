import { prescriptionService } from "@/services/prescription";

export const prescriptionMockApi = {
  listForEncounter: (encounterId: string) =>
    prescriptionService.listForEncounter(encounterId),
  listForPatient: (patientId: string) => prescriptionService.listForPatient(patientId),
  listRegimen: (patientId: string) => prescriptionService.listRegimen(patientId),
  getById: (prescriptionId: string) => prescriptionService.getById(prescriptionId),
  updateStatus: (prescriptionId: string, status: "sent_to_pharmacy" | "dispensed") =>
    prescriptionService.updateStatus(prescriptionId, status),
  discontinueRegimen: (regimenId: string, reason: string) =>
    prescriptionService.discontinueRegimen(regimenId, reason),
};
import { prescriptionService } from "@/services/prescription";
import type {
  PrescriptionContextRef,
  PrescriptionDraftItem,
} from "@/services/prescription/types";

export const prescriptionMockApi = {
  listForEncounter: (encounterId: string) =>
    prescriptionService.listForEncounter(encounterId),
  listForPatient: (patientId: string) => prescriptionService.listForPatient(patientId),
  listRegimen: (patientId: string) => prescriptionService.listRegimen(patientId),
  getById: (prescriptionId: string) => prescriptionService.getById(prescriptionId),
  getDraftForEncounter: (encounterId: string) =>
    prescriptionService.getDraftForEncounter(encounterId),
  createDraft: (
    encounterId: string,
    ref: PrescriptionContextRef,
    items: PrescriptionDraftItem[],
    instructions?: string
  ) => prescriptionService.createDraft(encounterId, ref, items, instructions),
  updateDraft: (
    prescriptionId: string,
    items: PrescriptionDraftItem[],
    instructions?: string
  ) => prescriptionService.updateDraft(prescriptionId, items, instructions),
  finalize: (prescriptionId: string) => prescriptionService.finalize(prescriptionId),
  cancel: (prescriptionId: string, reason?: string) =>
    prescriptionService.cancel(prescriptionId, reason),
  updateStatus: (prescriptionId: string, status: "sent_to_pharmacy" | "dispensed") =>
    prescriptionService.updateStatus(prescriptionId, status),
  discontinueRegimen: (regimenId: string, reason: string) =>
    prescriptionService.discontinueRegimen(regimenId, reason),
};
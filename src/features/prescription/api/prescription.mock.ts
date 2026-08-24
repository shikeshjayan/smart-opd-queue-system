import {
  listForEncounter,
  listForPatient,
  getById,
  getDraftForEncounter,
  listRegimen,
  createDraft,
  updateDraft,
  finalizePrescription,
  cancelPrescription,
  updateDispenseStatus,
  discontinueRegimen,
} from "@/server/actions/prescriptions";
import type {
  MedicationRegimenEntry,
  Prescription,
  PrescriptionContextRef,
  PrescriptionDraftItem,
} from "@/services/prescription/types";

export const prescriptionMockApi = {
  listForEncounter: (encounterId: string): Promise<Prescription[]> =>
    listForEncounter(encounterId),

  listForPatient: (patientId: string): Promise<Prescription[]> => listForPatient(patientId),

  listRegimen: (patientId: string): Promise<MedicationRegimenEntry[]> => listRegimen(patientId),

  getById: async (prescriptionId: string): Promise<Prescription | undefined> =>
    (await getById(prescriptionId)) ?? undefined,

  getDraftForEncounter: async (encounterId: string): Promise<Prescription | undefined> =>
    (await getDraftForEncounter(encounterId)) ?? undefined,

  createDraft: (
    encounterId: string,
    ref: PrescriptionContextRef,
    items: PrescriptionDraftItem[],
    instructions?: string
  ): Promise<Prescription> => createDraft(encounterId, ref, items, instructions),

  updateDraft: async (
    prescriptionId: string,
    items: PrescriptionDraftItem[],
    instructions?: string
  ): Promise<Prescription | undefined> =>
    (await updateDraft(prescriptionId, items, instructions)) ?? undefined,

  finalize: async (prescriptionId: string): Promise<Prescription | undefined> =>
    (await finalizePrescription(prescriptionId)) ?? undefined,

  cancel: async (prescriptionId: string, reason?: string): Promise<Prescription | undefined> =>
    (await cancelPrescription(prescriptionId, reason)) ?? undefined,

  updateStatus: async (
    prescriptionId: string,
    status: "sent_to_pharmacy" | "dispensed"
  ): Promise<Prescription | undefined> =>
    (await updateDispenseStatus(prescriptionId, status)) ?? undefined,

  discontinueRegimen: async (
    regimenId: string,
    reason: string
  ): Promise<MedicationRegimenEntry[]> => {
    await discontinueRegimen(regimenId, reason);
    return [];
  },
};

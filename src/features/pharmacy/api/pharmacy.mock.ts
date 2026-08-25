import { getEncounter, getPatient } from "@/services/data";
import { dispensePrescription } from "@/server/actions/pharmacy";
import { prescriptionService } from "@/services/prescription";
import type { Prescription } from "@/services/prescription/types";
import type { PharmacyQueueEntry, PharmacyQueueStatus } from "../types/pharmacy.types";

function entryFor(prescription: Prescription): PharmacyQueueEntry {
  const encounter = getEncounter(prescription.encounterId);
  const patient = getPatient(prescription.patientId);
  const dispensed = prescription.medicines.filter((m) => m.status === "dispensed").length;
  let status: PharmacyQueueStatus = "awaiting_dispatch";
  if (prescription.status === "dispensed") status = "dispensed";
  else if (dispensed > 0 && dispensed < prescription.medicines.length) status = "partially_dispensed";
  else if (prescription.status === "sent_to_pharmacy") status = "awaiting_dispatch";

  return {
    prescriptionId: prescription.id,
    encounterId: prescription.encounterId,
    patientId: prescription.patientId,
    patientName: patient?.name ?? "Patient",
    tokenNumber: encounter?.tokenNumber ?? "—",
    hospitalName: prescription.hospitalName,
    departmentName: prescription.departmentName,
    status,
    items: prescription.medicines.length,
    itemsDispensed: dispensed,
    requestedAt: prescription.issuedAt,
    dispensedAt: prescription.printedAt,
  };
}

export const pharmacyMockApi = {
  async getQueue(): Promise<PharmacyQueueEntry[]> {
    const all = await prescriptionService.listAll();
    return all
      .filter((p) => p.workflowStatus === "finalized" && p.status !== "dispensed" && p.medicines.length > 0)
      .map(entryFor)
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  },

  async dispatch(prescriptionId: string): Promise<void> {
    await prescriptionService.updateStatus(prescriptionId, "sent_to_pharmacy");
  },

  async dispense(prescriptionId: string, items: { medicineId: string; qty: number }[] = []): Promise<void> {
    await dispensePrescription(prescriptionId, items);
  },
};

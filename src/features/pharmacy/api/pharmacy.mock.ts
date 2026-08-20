import { getEncounter, getPatient } from "@/services/data";
import { prescriptionService } from "@/services/prescription";
import type { Prescription } from "@/services/prescription/types";
import type { DispenseActivity, PharmacyQueueEntry, PharmacyQueueStatus } from "../types/pharmacy.types";

const ACTIVITY_KEY = "smart-health.pharmacy-activity";

function loadActivities(): DispenseActivity[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? (JSON.parse(raw) as DispenseActivity[]) : [];
  } catch {
    return [];
  }
}

function saveActivity(activity: DispenseActivity): void {
  const current = loadActivities();
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify([activity, ...current]));
  } catch {
    // storage unavailable
  }
}

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
      .filter((p) => p.status !== "cancelled" && p.medicines.length > 0)
      .map(entryFor)
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  },

  async dispatch(prescriptionId: string): Promise<void> {
    const updated = await prescriptionService.updateStatus(prescriptionId, "sent_to_pharmacy");
    if (updated) {
      saveActivity({ id: `ph_act_${Date.now()}`, prescriptionId, action: "dispatched", at: new Date().toISOString(), by: "Doctor" });
    }
  },

  async dispense(prescriptionId: string): Promise<void> {
    const updated = await prescriptionService.updateStatus(prescriptionId, "dispensed");
    if (updated) {
      saveActivity({ id: `ph_act_${Date.now()}`, prescriptionId, action: "dispensed", at: new Date().toISOString(), by: "Pharmacy" });
    }
  },

  async listActivities(): Promise<DispenseActivity[]> {
    return loadActivities();
  },
};
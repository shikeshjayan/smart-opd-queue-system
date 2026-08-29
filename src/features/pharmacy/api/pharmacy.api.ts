import type { PharmacyQueueEntry, PharmacyQueueStatus } from "../types/pharmacy.types";
import { getPharmacyQueue, dispensePrescription, dispatchToPharmacy } from "@/server/actions/pharmacy";
import type { PharmacyQueueEntryEx } from "@/services/pharmacy/types";

function entryFor(entry: PharmacyQueueEntryEx): PharmacyQueueEntry {
  const totalItems = entry.items.length;
  const dispensed = entry.items.filter((i) => i.remainingQty === 0).length;
  let status: PharmacyQueueStatus = "awaiting_dispatch";
  if (entry.status === "partially_dispensed") status = "partially_dispensed";
  else if (entry.status === "sent_to_pharmacy" && dispensed === totalItems) status = "dispensed";

  return {
    prescriptionId: entry.prescriptionId,
    encounterId: entry.encounterId,
    patientId: entry.patientId,
    patientName: entry.patientName,
    tokenNumber: entry.tokenNumber ?? "—",
    hospitalName: entry.hospitalName,
    departmentName: entry.departmentName,
    status,
    items: totalItems,
    itemsDispensed: dispensed,
    requestedAt: entry.finalizedAt ?? new Date().toISOString(),
    dispensedAt: entry.dispatchedAt,
  };
}

export const pharmacyApi = {
  async getQueue(): Promise<PharmacyQueueEntry[]> {
    const entries = await getPharmacyQueue();
    return entries.map(entryFor);
  },

  async dispatch(prescriptionId: string): Promise<void> {
    await dispatchToPharmacy(prescriptionId);
  },

  async dispense(
    prescriptionId: string,
    hospitalId?: string,
    items: { medicineId: string; itemId?: string; qty: number }[] = []
  ): Promise<void> {
    await dispensePrescription(
      prescriptionId,
      hospitalId,
      items.map((i) => ({ itemId: i.itemId ?? i.medicineId, medicineId: i.medicineId, quantity: i.qty }))
    );
  },
};
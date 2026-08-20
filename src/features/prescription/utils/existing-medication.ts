import type { MedicationRegimenEntry, PrescriptionDraftItem } from "@/services/prescription/types";
import { medicineById } from "@/services/medicine";

export function existingMedicationWarnings(
  existing: MedicationRegimenEntry[],
  items: PrescriptionDraftItem[]
): Record<string, string> {
  const active = existing.filter((entry) => entry.status === "active");
  const warnings: Record<string, string> = {};

  for (const item of items) {
    if (warnings[item.medicineId]) continue;
    const exact = active.find((entry) => entry.medicineId === item.medicineId);
    if (exact) {
      warnings[item.medicineId] = `Patient is currently taking ${exact.genericName}. Review existing prescription.`;
      continue;
    }
    const medicine = medicineById(item.medicineId);
    if (!medicine?.allergyGroup) continue;
    const related = active.find(
      (entry) => medicineById(entry.medicineId)?.allergyGroup === medicine.allergyGroup
    );
    if (related) {
      warnings[item.medicineId] = `Patient is on ${related.genericName}, which belongs to the ${medicine.allergyGroup} group. Review before adding ${medicine.genericName}.`;
    }
  }

  return warnings;
}
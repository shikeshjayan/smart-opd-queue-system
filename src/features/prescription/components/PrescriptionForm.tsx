import { useMemo } from "react";
import type { Medicine } from "@/services/medicine/types";
import type { MedicationRegimenEntry, PrescriptionDraftItem } from "@/services/prescription/types";
import { medicineById } from "@/services/medicine";
import { MedicineSearch } from "@/features/medicine/components/MedicineSearch";
import { MedicationSafetyWarnings } from "@/features/medicine/components/MedicationSafetyWarnings";
import { MedicationSafetyNotice } from "@/features/medicine/components/MedicationSafetyNotice";
import { dailyDoseMg } from "@/features/medicine/utils/dosage";
import { Button } from "@/components/ui/button";
import { MedicineItem } from "./MedicineItem";
import { labelCls, textareaCls } from "@/features/consultation/utils/classes";
import { existingMedicationWarnings } from "../utils/existing-medication";
import type { PrescriptionItemErrors } from "../utils/prescription-validation";

const VALID_ROUTES = [
  "Oral",
  "Topical",
  "Intravenous",
  "Intramuscular",
  "Subcutaneous",
  "Transdermal",
  "Inhaled",
];

type PrescriptionFormProps = {
  items: PrescriptionDraftItem[];
  onChange: (items: PrescriptionDraftItem[]) => void;
  instructions: string;
  onInstructionsChange: (value: string) => void;
  allergies: string[];
  existingMedications: MedicationRegimenEntry[];
  saving: boolean;
  savedAt: Date | null;
  actionError: string | null;
  itemErrors: PrescriptionItemErrors[];
  onReview: () => void;
  onSaveNow: () => void;
};

export function PrescriptionForm({
  items,
  onChange,
  instructions,
  onInstructionsChange,
  allergies,
  existingMedications,
  saving,
  savedAt,
  actionError,
  itemErrors,
  onReview,
  onSaveNow,
}: PrescriptionFormProps) {
  const existingWarnings = useMemo(
    () => existingMedicationWarnings(existingMedications, items),
    [existingMedications, items]
  );

  const addMedicine = (medicine: Medicine) => {
    if (items.some((item) => item.medicineId === medicine.id)) return;
    const route = medicine.route && VALID_ROUTES.includes(medicine.route) ? medicine.route : "Oral";
    onChange([
      ...items,
      {
        medicineId: medicine.id,
        medicineName: medicine.genericName,
        genericName: medicine.genericName,
        brandLabel: medicine.brandNames[0] ?? "",
        dosage: medicine.strengths[0] ?? "",
        frequency: medicine.typicalFrequencies[0] ?? "1-0-1",
        route,
        duration: { value: 5, unit: "days" },
      },
    ]);
  };

  const updateItem = (index: number, patch: Partial<PrescriptionDraftItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const doses = items.map((item) => ({
    medicineId: item.medicineId,
    dosage: item.dosage,
    frequency: item.frequency,
    dailyDoseMg: dailyDoseMg(item.dosage, item.frequency),
  }));

  return (
    <div className="flex flex-col gap-4">
      {actionError && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-3 text-sm text-status-danger">
          {actionError}
        </p>
      )}

      <MedicineSearch
        onSelect={(medicine) => {
          addMedicine(medicine);
        }}
      />

      {items.length === 0 ? (
        <p className="rounded-card border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
          Search and add medicines to build the prescription.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, index) => {
            const medicine = medicineById(item.medicineId);
            if (!medicine) return null;
            return (
              <MedicineItem
                key={item.medicineId}
                medicine={medicine}
                item={item}
                onChange={(patch) => updateItem(index, patch)}
                onRemove={() => removeItem(index)}
                errors={itemErrors[index]}
                existingMedicationWarning={existingWarnings[item.medicineId] ?? null}
              />
            );
          })}
        </div>
      )}

      <MedicationSafetyWarnings allergies={allergies} doses={doses} />

      {items.length > 0 && (
        <label className="block">
          <span className={labelCls}>Prescription instructions</span>
          <textarea
            className={textareaCls}
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            placeholder="e.g. Take medicines after food"
            rows={2}
          />
        </label>
      )}

      <MedicationSafetyNotice />

      <div className="flex flex-col gap-3 border-t border-ink-200 pt-4 sm:flex-row sm:items-center">
        <p className="flex-1 text-xs text-ink-500">
          {saving ? "Saving…" : savedAt ? `Saved at ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Draft not saved yet"}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" size="lg" onClick={onSaveNow} disabled={saving || items.length === 0}>
            Save Draft
          </Button>
          <Button size="lg" onClick={onReview} disabled={items.length === 0}>
            Review Prescription
          </Button>
        </div>
      </div>
    </div>
  );
}
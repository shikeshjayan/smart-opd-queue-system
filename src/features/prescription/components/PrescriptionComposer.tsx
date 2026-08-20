import type { PrescriptionDraftItem } from "@/services/prescription/types";
import { medicineById } from "@/services/medicine";
import { MedicineSearch } from "@/features/medicine/components/MedicineSearch";
import { DosageField } from "@/features/medicine/components/DosageField";
import { MedicationSafetyWarnings } from "@/features/medicine/components/MedicationSafetyWarnings";
import { MedicationSafetyNotice } from "@/features/medicine/components/MedicationSafetyNotice";
import { dailyDoseMg } from "@/features/medicine/utils/dosage";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";

type PrescriptionComposerProps = {
  items: PrescriptionDraftItem[];
  onChange: (items: PrescriptionDraftItem[]) => void;
  allergies: string[];
  instructions: string;
  onInstructionsChange: (value: string) => void;
};

export function PrescriptionComposer({
  items,
  onChange,
  allergies,
  instructions,
  onInstructionsChange,
}: PrescriptionComposerProps) {
  const addMedicine = (medicineId: string) => {
    if (items.some((i) => i.medicineId === medicineId)) return;
    const medicine = medicineById(medicineId);
    if (!medicine) return;
    onChange([
      ...items,
      {
        medicineId,
        brandLabel: medicine.brandNames[0] ?? medicine.genericName,
        dosage: medicine.strengths[0] ?? "",
        frequency: medicine.typicalFrequencies[0] ?? "1-0-1",
        durationDays: 5,
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
      <MedicineSearch
        onSelect={(medicine) => {
          addMedicine(medicine.id);
        }}
      />

      {items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((item, index) => {
            const medicine = medicineById(item.medicineId);
            if (!medicine) return null;
            return (
              <div key={item.medicineId} className="rounded-card border border-ink-200 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-900">
                    {medicine.genericName}
                    <span className="ml-2 text-xs font-normal text-ink-500">
                      {medicine.form} {item.brandLabel ? `· ${item.brandLabel}` : ""}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded-btn px-2 py-1 text-xs font-medium text-status-danger hover:bg-status-danger-soft"
                  >
                    Remove
                  </button>
                </div>
                <DosageField
                  medicine={medicine}
                  value={{
                    dosage: item.dosage,
                    frequency: item.frequency,
                    durationDays: item.durationDays,
                    route: item.instructions,
                  }}
                  onChange={(value) =>
                    updateItem(index, {
                      dosage: value.dosage,
                      frequency: value.frequency,
                      durationDays: value.durationDays,
                      instructions: value.route,
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      <MedicationSafetyWarnings allergies={allergies} doses={doses} />

      {items.length > 0 && (
        <label className="block">
          <span className={labelCls}>Prescription instructions</span>
          <input
            className={inputCls}
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            placeholder="e.g. Take medicines after food"
          />
        </label>
      )}

      <MedicationSafetyNotice />
    </div>
  );
}
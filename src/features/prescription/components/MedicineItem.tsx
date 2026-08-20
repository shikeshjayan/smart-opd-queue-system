import type { Medicine } from "@/services/medicine/types";
import type { PrescriptionDraftItem } from "@/services/prescription/types";
import { DosageField } from "@/features/medicine/components/DosageField";
import { dailyDoseMg } from "@/features/medicine/utils/dosage";
import { FrequencyField } from "./FrequencyField";
import { RouteField } from "./RouteField";
import { DurationField } from "./DurationField";
import { textareaCls, labelCls } from "@/features/consultation/utils/classes";
import type { PrescriptionItemErrors } from "../utils/prescription-validation";

type MedicineItemProps = {
  medicine: Medicine;
  item: PrescriptionDraftItem;
  onChange: (patch: Partial<PrescriptionDraftItem>) => void;
  onRemove: () => void;
  errors?: PrescriptionItemErrors;
  existingMedicationWarning?: string | null;
};

export function MedicineItem({
  medicine,
  item,
  onChange,
  onRemove,
  errors,
  existingMedicationWarning,
}: MedicineItemProps) {
  const daily = dailyDoseMg(item.dosage, item.frequency);
  const overMax = daily !== undefined && !!medicine.maxDailyDoseMg && daily > medicine.maxDailyDoseMg;
  const fieldErrors = Object.values(errors ?? {}).filter(Boolean);

  return (
    <div className="rounded-card border border-ink-200 bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink-900">{medicine.genericName}</p>
          <p className="text-xs text-ink-500">
            {medicine.form}
            {item.brandLabel ? ` · ${item.brandLabel}` : ""}
            {item.genericName && item.genericName !== medicine.genericName
              ? ` · Generic: ${item.genericName}`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-btn px-2 py-1 text-xs font-medium text-status-danger hover:bg-status-danger-soft"
        >
          Remove
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DosageField medicine={medicine} value={item.dosage} onChange={(dosage) => onChange({ dosage })} />
        <FrequencyField
          value={item.frequency}
          onChange={(frequency) => onChange({ frequency })}
          suggestions={medicine.typicalFrequencies}
        />
        <RouteField value={item.route} onChange={(route) => onChange({ route })} />
        <DurationField value={item.duration} onChange={(duration) => onChange({ duration })} />
      </div>

      <label className="mt-3 block">
        <span className={labelCls}>Instructions</span>
        <textarea
          className={textareaCls}
          value={item.instructions ?? ""}
          onChange={(e) => onChange({ instructions: e.target.value })}
          placeholder="e.g. Take after food"
          rows={2}
        />
      </label>

      {existingMedicationWarning && (
        <p className="mt-3 rounded-card border border-status-warning-soft bg-status-warning-soft px-3 py-2 text-sm text-status-warning">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide">Existing medication:</span>
          {existingMedicationWarning}
        </p>
      )}

      {overMax && (
        <p className="mt-3 text-xs text-status-warning">
          Daily dose {daily} mg exceeds the typical maximum of {medicine.maxDailyDoseMg} mg for{" "}
          {medicine.genericName}. Review before prescribing.
        </p>
      )}
      {medicine.packageNote && (
        <p className="mt-2 text-xs text-ink-500">{medicine.packageNote}</p>
      )}

      {fieldErrors.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {fieldErrors.map((error) => (
            <li key={error} className="text-xs text-status-danger">
              {error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
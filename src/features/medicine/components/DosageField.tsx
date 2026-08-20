import type { Medicine } from "@/services/medicine/types";
import { dailyDoseMg } from "../utils/dosage";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";

export type DosageValue = {
  dosage: string;
  frequency: string;
  durationDays: number;
  route?: string;
  instructions?: string;
};

type DosageFieldProps = {
  medicine: Medicine;
  value: DosageValue;
  onChange: (value: DosageValue) => void;
};

export function DosageField({ medicine, value, onChange }: DosageFieldProps) {
  const daily = dailyDoseMg(value.dosage, value.frequency);
  const overMax = daily !== undefined && !!medicine.maxDailyDoseMg && daily > medicine.maxDailyDoseMg;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-3">
      <label className="block">
        <span className={labelCls}>Strength</span>
        <select
          className={inputCls}
          value={value.dosage}
          onChange={(e) => onChange({ ...value, dosage: e.target.value })}
        >
          {(medicine.strengths.length > 0 ? medicine.strengths : ["—"]).map((strength) => (
            <option key={strength} value={strength}>
              {strength}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={labelCls}>Frequency</span>
        <select
          className={inputCls}
          value={value.frequency}
          onChange={(e) => onChange({ ...value, frequency: e.target.value })}
        >
          {(medicine.typicalFrequencies.length > 0 ? medicine.typicalFrequencies : ["1-0-0", "1-0-1", "1-1-1"]).map(
            (frequency) => (
              <option key={frequency} value={frequency}>
                {frequency}
              </option>
            )
          )}
        </select>
      </label>
      <label className="block">
        <span className={labelCls}>Duration (days)</span>
        <input
          className={inputCls}
          type="number"
          min={1}
          value={value.durationDays}
          onChange={(e) =>
            onChange({ ...value, durationDays: Math.max(1, Number(e.target.value) || 1) })
          }
        />
      </label>
      <label className="block flex-1">
        <span className={labelCls}>Route / instructions</span>
        <input
          className={inputCls}
          value={value.route ?? medicine.route ?? "Oral"}
          onChange={(e) => onChange({ ...value, route: e.target.value })}
          placeholder="e.g. Oral, before food"
        />
      </label>

      {overMax && (
        <p className="w-full text-xs text-status-warning">
          Daily dose {daily} mg exceeds the typical maximum of {medicine.maxDailyDoseMg} mg for{" "}
          {medicine.genericName}. Review before prescribing.
        </p>
      )}
      {medicine.packageNote && (
        <p className="w-full text-xs text-ink-500">{medicine.packageNote}</p>
      )}
    </div>
  );
}
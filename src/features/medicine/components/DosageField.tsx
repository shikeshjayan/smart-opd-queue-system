import type { Medicine } from "@/services/medicine/types";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";

type DosageFieldProps = {
  medicine: Medicine;
  value: string;
  onChange: (value: string) => void;
};

export function DosageField({ medicine, value, onChange }: DosageFieldProps) {
  const strengths = medicine.strengths;
  const isCustom = strengths.length > 0 && !strengths.includes(value);

  if (strengths.length === 0) {
    return (
      <label className="block min-w-28">
        <span className={labelCls}>Dose / strength</span>
        <input
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 500 mg"
        />
      </label>
    );
  }

  return (
    <label className="block min-w-28">
      <span className={labelCls}>Dose / strength</span>
      <select
        className={inputCls}
        value={isCustom ? "__custom__" : value}
        onChange={(e) => {
          if (e.target.value !== "__custom__") onChange(e.target.value);
        }}
      >
        {strengths.map((strength) => (
          <option key={strength} value={strength}>
            {strength}
          </option>
        ))}
        <option value="__custom__">Other…</option>
      </select>
      {isCustom && (
        <input
          className={`${inputCls} mt-2`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 1 g"
        />
      )}
    </label>
  );
}
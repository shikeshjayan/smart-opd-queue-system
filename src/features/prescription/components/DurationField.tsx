import type { Duration, DurationUnit } from "@/services/prescription/types";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";

type DurationFieldProps = {
  value: Duration;
  onChange: (value: Duration) => void;
};

export function DurationField({ value, onChange }: DurationFieldProps) {
  return (
    <div>
      <span className={labelCls}>Duration</span>
      <div className="flex gap-2">
        <input
          className={`${inputCls} w-24`}
          type="number"
          min={1}
          value={value.value}
          onChange={(e) =>
            onChange({ ...value, value: Math.max(1, Number(e.target.value) || 1) })
          }
          aria-label="Duration value"
        />
        <select
          className={`${inputCls} flex-1`}
          value={value.unit}
          onChange={(e) => onChange({ ...value, unit: e.target.value as DurationUnit })}
          aria-label="Duration unit"
        >
          <option value="days">Days</option>
          <option value="weeks">Weeks</option>
          <option value="months">Months</option>
        </select>
      </div>
    </div>
  );
}
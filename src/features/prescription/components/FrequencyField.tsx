import { useMemo } from "react";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";

const PRESETS: Array<{ label: string; value: string }> = [
  { label: "Once daily (1-0-0)", value: "1-0-0" },
  { label: "Twice daily (1-0-1)", value: "1-0-1" },
  { label: "Three times daily (1-1-1)", value: "1-1-1" },
  { label: "Four times daily (1-1-1-1)", value: "1-1-1-1" },
  { label: "Every 6 hours", value: "Every 6 hours" },
  { label: "Every 8 hours", value: "Every 8 hours" },
  { label: "As required", value: "As required" },
];

const CUSTOM_VALUE = "__custom__";

type FrequencyFieldProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
};

export function FrequencyField({ value, onChange, suggestions = [] }: FrequencyFieldProps) {
  const options = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ label: string; value: string }> = [];
    for (const option of [...PRESETS]) {
      if (seen.has(option.value)) continue;
      seen.add(option.value);
      list.push(option);
    }
    for (const suggestion of suggestions) {
      if (seen.has(suggestion)) continue;
      seen.add(suggestion);
      list.push({ label: suggestion, value: suggestion });
    }
    return list;
  }, [suggestions]);

  const isCustom = value !== "" && !options.some((option) => option.value === value);

  return (
    <label className="block min-w-32">
      <span className={labelCls}>Frequency</span>
      <select
        className={inputCls}
        value={isCustom ? CUSTOM_VALUE : value}
        onChange={(e) => {
          if (e.target.value !== CUSTOM_VALUE) onChange(e.target.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        <option value={CUSTOM_VALUE}>Custom…</option>
      </select>
      {isCustom && (
        <input
          className={`${inputCls} mt-2`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Every alternate day"
        />
      )}
    </label>
  );
}
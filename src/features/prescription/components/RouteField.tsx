import { useMemo } from "react";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";

const ROUTE_OPTIONS = [
  "Oral",
  "Topical",
  "Intravenous",
  "Intramuscular",
  "Subcutaneous",
  "Transdermal",
  "Inhaled",
];

const CUSTOM_VALUE = "__custom__";

type RouteFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function RouteField({ value, onChange }: RouteFieldProps) {
  const options = useMemo(() => ROUTE_OPTIONS, []);
  const isCustom = value !== "" && !options.includes(value);

  return (
    <label className="block min-w-32">
      <span className={labelCls}>Route</span>
      <select
        className={inputCls}
        value={isCustom ? CUSTOM_VALUE : value}
        onChange={(e) => {
          if (e.target.value !== CUSTOM_VALUE) onChange(e.target.value);
        }}
      >
        {options.map((route) => (
          <option key={route} value={route}>
            {route}
          </option>
        ))}
        <option value={CUSTOM_VALUE}>Other…</option>
      </select>
      {isCustom && (
        <input
          className={`${inputCls} mt-2`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Oral before food"
        />
      )}
    </label>
  );
}
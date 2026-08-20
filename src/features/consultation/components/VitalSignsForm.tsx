import type { VitalSigns } from "@/services/consultation/types";
import { SectionCard } from "./SectionCard";
import { hintCls, inputCls, labelCls } from "../utils/classes";

type VitalSignsFormProps = {
  value: VitalSigns;
  onChange: (value: VitalSigns) => void;
};

function NumberField({
  label,
  unit,
  value,
  onChange,
  width = "w-28",
}: {
  label: string;
  unit: string;
  value?: number;
  onChange: (v?: number) => void;
  width?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          className={`${inputCls} ${width}`}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
        <span className="text-sm text-ink-500">{unit}</span>
      </span>
    </label>
  );
}

function bmiOf(heightCm?: number, weightKg?: number): number | null {
  if (!heightCm || !weightKg) return null;
  const metres = heightCm / 100;
  if (metres <= 0) return null;
  return Math.round((weightKg / (metres * metres)) * 10) / 10;
}

export function VitalSignsForm({ value, onChange }: VitalSignsFormProps) {
  const bmi = bmiOf(value.heightCm, value.weightKg);

  return (
    <SectionCard title="Vitals">
      <div className="flex flex-wrap gap-x-5 gap-y-4">
        <NumberField label="Systolic BP" unit="mmHg" width="w-24" value={value.bpSystolic} onChange={(v) => onChange({ ...value, bpSystolic: v })} />
        <NumberField label="Diastolic BP" unit="mmHg" width="w-24" value={value.bpDiastolic} onChange={(v) => onChange({ ...value, bpDiastolic: v })} />
        <NumberField label="Pulse" unit="bpm" width="w-24" value={value.pulse} onChange={(v) => onChange({ ...value, pulse: v })} />
        <NumberField label="Temperature" unit="°F" width="w-24" value={value.temperature} onChange={(v) => onChange({ ...value, temperature: v })} />
        <NumberField label="Resp Rate" unit="/min" width="w-24" value={value.respiratoryRate} onChange={(v) => onChange({ ...value, respiratoryRate: v })} />
        <NumberField label="SpO₂" unit="%" width="w-24" value={value.spo2} onChange={(v) => onChange({ ...value, spo2: v })} />
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-4 border-t border-ink-100 pt-5">
        <NumberField label="Height" unit="cm" width="w-24" value={value.heightCm} onChange={(v) => onChange({ ...value, heightCm: v })} />
        <NumberField label="Weight" unit="kg" width="w-24" value={value.weightKg} onChange={(v) => onChange({ ...value, weightKg: v })} />
        {bmi !== null && (
          <div>
            <span className={labelCls}>BMI</span>
            <p className="text-2xl font-bold tabular-nums text-ink-900">
              {bmi}
              <span className="ml-2 text-xs font-normal text-ink-500">kg/m²</span>
            </p>
            <p className={hintCls}>Calculated preview — authoritative value is recorded by the health system.</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
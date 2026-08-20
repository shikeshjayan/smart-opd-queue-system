import { SectionCard } from "./SectionCard";
import { textareaCls, labelCls, hintCls } from "../utils/classes";

const COMMON_SYMPTOMS = [
  "Fever",
  "Cough",
  "Headache",
  "Chest pain",
  "Breathlessness",
  "Vomiting",
  "Dizziness",
  "Fatigue",
  "Body ache",
  "Sore throat",
  "Nausea",
  "Abdominal pain",
];

const OTHER_PREFIX = "Other: ";

type SymptomsProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

export function Symptoms({ value, onChange }: SymptomsProps) {
  const chips = value.filter((s) => !s.startsWith(OTHER_PREFIX));
  const other = value.find((s) => s.startsWith(OTHER_PREFIX))?.slice(OTHER_PREFIX.length) ?? "";

  const toggle = (symptom: string) => {
    const next = chips.includes(symptom)
      ? chips.filter((s) => s !== symptom)
      : [...chips, symptom];
    onChange([...next, ...(other ? [`${OTHER_PREFIX}${other}`] : [])]);
  };

  return (
    <SectionCard title="Symptoms">
      <div className="flex flex-wrap gap-2">
        {COMMON_SYMPTOMS.map((symptom) => {
          const selected = chips.includes(symptom);
          return (
            <button
              key={symptom}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(symptom)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-600 ${
                selected
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-ink-300 text-ink-600 hover:bg-ink-100"
              }`}
            >
              {symptom}
            </button>
          );
        })}
      </div>
      <label className="mt-4 block">
        <span className={labelCls}>Other symptoms</span>
        <textarea
          className={`${textareaCls} min-h-[3.5rem]`}
          value={other}
          onChange={(e) =>
            onChange([...chips, ...(e.target.value ? [`${OTHER_PREFIX}${e.target.value}`] : [])])
          }
          placeholder="Any additional symptoms not listed"
        />
        <span className={hintCls}>Select common symptoms above or describe additional ones here.</span>
      </label>
    </SectionCard>
  );
}
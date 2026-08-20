import { useState } from "react";
import type { Diagnosis } from "@/services/consultation/types";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "./SectionCard";
import { inputCls, hintCls, labelCls } from "../utils/classes";

const DIAGNOSIS_CATALOG: Array<{ code: string; name: string }> = [
  { code: "I10", name: "Hypertension" },
  { code: "E11.9", name: "Type 2 diabetes mellitus" },
  { code: "I20.9", name: "Suspected stable angina" },
  { code: "J06.9", name: "Acute upper respiratory infection" },
  { code: "B34.9", name: "Viral fever" },
  { code: "K29.7", name: "Gastritis" },
  { code: "M17.9", name: "Osteoarthritis" },
  { code: "E78.5", name: "Dyslipidaemia" },
  { code: "R50.9", name: "Fever, unspecified" },
  { code: "J45.9", name: "Asthma" },
  { code: "K21.0", name: "Gastro-esophageal reflux disease" },
  { code: "J01.9", name: "Acute sinusitis" },
  { code: "N39.0", name: "Urinary tract infection" },
  { code: "M54.9", name: "Back pain" },
  { code: "R51", name: "Headache" },
  { code: "J18.9", name: "Pneumonia, unspecified" },
  { code: "F41.9", name: "Anxiety disorder" },
  { code: "E66.9", name: "Obesity" },
];

type DiagnosisFormProps = {
  value: Diagnosis[];
  onChange: (value: Diagnosis[]) => void;
};

export function DiagnosisForm({ value, onChange }: DiagnosisFormProps) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = q
    ? DIAGNOSIS_CATALOG.filter(
        (d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
      ).slice(0, 8)
    : [];

  const add = (name: string, code?: string) => {
    const hasPrimary = value.some((d) => d.type === "primary");
    onChange([...value, { code, name, type: hasPrimary ? "secondary" : "primary" }]);
    setQuery("");
  };

  const setType = (index: number, type: Diagnosis["type"]) => {
    onChange(value.map((d, i) => (i === index ? { ...d, type } : d)));
  };

  return (
    <SectionCard title="Diagnosis">
      {value.length > 0 && (
        <ul className="mb-4 flex flex-col gap-2">
          {value.map((diagnosis, index) => (
            <li
              key={`${diagnosis.code ?? diagnosis.name}-${index}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-ink-200 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink-900">
                  {diagnosis.name}
                  {diagnosis.code && (
                    <span className="ml-1.5 font-mono text-xs text-ink-500">{diagnosis.code}</span>
                  )}
                </span>
                <Badge variant={diagnosis.type === "primary" ? "info" : "default"}>
                  {diagnosis.type === "primary" ? "Primary" : "Secondary"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Diagnosis type"
                  className="h-8 rounded-btn border border-ink-300 bg-surface px-2 text-xs text-ink-700"
                  value={diagnosis.type}
                  onChange={(e) => setType(index, e.target.value as Diagnosis["type"])}
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                </select>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  className="rounded-btn px-2 py-1 text-xs font-medium text-status-danger hover:bg-status-danger-soft"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className="block">
        <span className={labelCls}>Search diagnosis</span>
        <input
          className={inputCls}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or code"
        />
      </label>

      {q.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-card border border-ink-200">
          {results.length === 0 ? (
            <div className="flex items-center justify-between gap-2 bg-surface px-3 py-2.5">
              <p className="text-sm text-ink-500">No catalog match for “{query}”.</p>
              <button
                type="button"
                onClick={() => add(query)}
                className="rounded-btn border border-brand-600 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
              >
                Add as free text
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-ink-100 bg-surface">
              {results.map((result) => (
                <li key={result.code}>
                  <button
                    type="button"
                    onClick={() => add(result.name, result.code)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-brand-50"
                  >
                    <span className="text-ink-900">{result.name}</span>
                    <span className="font-mono text-xs text-ink-500">{result.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className={hintCls}>
        Selecting a diagnosis code prepares the record for the approved clinical terminology.
      </p>
    </SectionCard>
  );
}
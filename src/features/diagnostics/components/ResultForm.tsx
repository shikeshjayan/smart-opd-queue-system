import type { CatalogParameter, ResultValue, TestCatalogItem } from "@/services/diagnostics/types";
import { computeResultFlag } from "@/services/diagnostics";
import { Button } from "@/components/ui/button";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";
import { AbnormalResultBadge } from "./AbnormalResultBadge";

type ResultFormProps = {
  test: TestCatalogItem;
  values: ResultValue[];
  onChangeValues: (values: ResultValue[]) => void;
  notes: string;
  onChangeNotes: (value: string) => void;
  saving: boolean;
  submitting: boolean;
  actionError: string | null;
  onSaveDraft: () => void;
  onFinalize: () => void;
  canFinalize: boolean;
};

export function ResultForm({
  test,
  values,
  onChangeValues,
  notes,
  onChangeNotes,
  saving,
  submitting,
  actionError,
  onSaveDraft,
  onFinalize,
  canFinalize,
}: ResultFormProps) {
  const updateValue = (parameter: CatalogParameter, raw: string) => {
    const existing = values.find((v) => v.parameterKey === parameter.key);
    const next: ResultValue = {
      parameterKey: parameter.key,
      name: parameter.name,
      unit: parameter.unit,
      refText: parameter.refText,
      refLow: parameter.refLow,
      refHigh: parameter.refHigh,
      value: raw,
      flag: computeResultFlag(raw, parameter),
    };
    onChangeValues(
      existing
        ? values.map((v) => (v.parameterKey === parameter.key ? next : v))
        : [...values, next]
    );
  };

  const valueFor = (key: string) => values.find((v) => v.parameterKey === key)?.value ?? "";

  return (
    <div className="flex flex-col gap-4">
      {actionError && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-3 text-sm text-status-danger">
          {actionError}
        </p>
      )}

      <p className="text-sm font-semibold text-ink-900">{test.name}</p>
      <p className="-mt-2 text-xs capitalize text-ink-500">{test.category} · {test.specimenType}</p>

      <div className="flex flex-col gap-3">
        {test.parameters.map((parameter) => {
          const value = valueFor(parameter.key);
          const flag = computeResultFlag(value, parameter);
          return (
            <div key={parameter.key} className="rounded-card border border-ink-200 p-3">
              <label className="block">
                <span className={labelCls}>{parameter.name}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className={`${inputCls} max-w-40`}
                    type={parameter.numeric ? "number" : "text"}
                    inputMode={parameter.numeric ? "decimal" : undefined}
                    step={parameter.numeric ? "any" : undefined}
                    value={value}
                    onChange={(e) => updateValue(parameter, e.target.value)}
                    placeholder={parameter.numeric ? "Value" : "Text / finding"}
                  />
                  {parameter.unit && <span className="text-sm text-ink-500">{parameter.unit}</span>}
                </div>
              </label>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-ink-500">
                  Reference:{" "}
                  {parameter.refText ??
                    (parameter.refLow !== undefined || parameter.refHigh !== undefined
                      ? `${parameter.refLow ?? "≤"} – ${parameter.refHigh ?? "≥"}${parameter.unit ? ` ${parameter.unit}` : ""}`
                      : "—")}
                </p>
                {flag && <AbnormalResultBadge flag={flag} />}
              </div>
            </div>
          );
        })}
      </div>

      <label className="block">
        <span className={labelCls}>Notes</span>
        <textarea
          className="min-h-[5rem] w-full rounded-btn border border-ink-300 bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-2 focus:outline-brand-600"
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder="Optional notes (not shown to patient unless intended)"
        />
      </label>

      <div className="flex flex-col gap-3 border-t border-ink-200 pt-4 sm:flex-row">
        <Button variant="outline" size="lg" className="flex-1" disabled={saving || submitting} onClick={onSaveDraft}>
          {saving ? "Saving…" : "Save Draft"}
        </Button>
        <Button size="lg" className="flex-1" disabled={submitting || !canFinalize} onClick={onFinalize}>
          {submitting ? "Finalizing..." : "Finalize Result"}
        </Button>
      </div>
    </div>
  );
}
import type { FollowUp, FollowUpDecision } from "@/services/consultation/types";
import { SectionCard } from "./SectionCard";
import { inputCls, textareaCls, labelCls } from "../utils/classes";

const DECISIONS: Array<{ value: FollowUpDecision; label: string }> = [
  { value: "none", label: "None" },
  { value: "return", label: "Return visit" },
  { value: "review", label: "Scheduled review" },
  { value: "refer", label: "Referral" },
];

type FollowUpProps = {
  value: FollowUp;
  onChange: (value: FollowUp) => void;
};

export function FollowUp({ value, onChange }: FollowUpProps) {
  return (
    <SectionCard title="Follow-up">
      <div>
        <span className={labelCls}>Follow-up decision</span>
        <div className="mt-1 flex flex-wrap gap-2">
          {DECISIONS.map((decision) => (
            <button
              key={decision.value}
              type="button"
              aria-pressed={value.decision === decision.value}
              onClick={() => onChange({ ...value, decision: decision.value })}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-600 ${
                value.decision === decision.value
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-ink-300 text-ink-600 hover:bg-ink-100"
              }`}
            >
              {decision.label}
            </button>
          ))}
        </div>
      </div>

      {value.decision !== "none" && (
        <div className="mt-4 flex flex-col gap-4">
          {value.decision !== "refer" && (
            <label className="block max-w-xs">
              <span className={labelCls}>Date</span>
              <input
                className={inputCls}
                type="date"
                value={value.date ?? ""}
                onChange={(e) => onChange({ ...value, date: e.target.value })}
              />
            </label>
          )}
          <label className="block">
            <span className={labelCls}>Instructions</span>
            <textarea
              className={textareaCls}
              value={value.notes ?? ""}
              onChange={(e) => onChange({ ...value, notes: e.target.value })}
              placeholder="What should the patient do next?"
            />
          </label>
        </div>
      )}
    </SectionCard>
  );
}
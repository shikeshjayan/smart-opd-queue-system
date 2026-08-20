import type { DiagnosticOrderItem } from "@/services/diagnostics/types";
import { labelCls, textareaCls } from "@/features/consultation/utils/classes";

type TestOrderItemProps = {
  item: DiagnosticOrderItem;
  index: number;
  onChange: (patch: Partial<DiagnosticOrderItem>) => void;
  onRemove: () => void;
};

export function TestOrderItem({ item, index, onChange, onRemove }: TestOrderItemProps) {
  return (
    <div className="rounded-card border border-ink-200 bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink-900">
            {index + 1}. {item.testName}
          </p>
          <p className="text-xs capitalize text-ink-500">{item.category}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-btn px-2 py-1 text-xs font-medium text-status-danger hover:bg-status-danger-soft"
        >
          Remove
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
        <label className="block">
          <span className={labelCls}>Priority</span>
          <div className="flex gap-2">
            {(["routine", "urgent"] as const).map((priority) => (
              <button
                key={priority}
                type="button"
                aria-pressed={item.priority === priority}
                onClick={() => onChange({ priority })}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  item.priority === priority
                    ? priority === "urgent"
                      ? "border-status-danger bg-status-danger-soft text-status-danger"
                      : "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-ink-300 text-ink-600 hover:bg-ink-100"
                }`}
              >
                {priority === "urgent" ? "Urgent" : "Routine"}
              </button>
            ))}
          </div>
        </label>
        <label className="block flex-1">
          <span className={labelCls}>Instructions</span>
          <textarea
            className={textareaCls}
            rows={1}
            value={item.instructions ?? ""}
            onChange={(e) => onChange({ instructions: e.target.value })}
            placeholder="e.g. Fasting sample required"
          />
        </label>
      </div>
    </div>
  );
}
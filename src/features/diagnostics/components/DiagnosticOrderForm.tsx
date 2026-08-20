import type { DiagnosticOrderItem, TestCatalogItem } from "@/services/diagnostics/types";
import { Button } from "@/components/ui/button";
import { TestSearch } from "./TestSearch";
import { TestOrderItem } from "./TestOrderItem";

type DiagnosticOrderFormProps = {
  items: DiagnosticOrderItem[];
  updateItems: (items: DiagnosticOrderItem[]) => void;
  clinicalNotes: string;
  updateNotes: (value: string) => void;
  saving: boolean;
  error: string | null;
  submitting: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
};

export function DiagnosticOrderForm({
  items,
  updateItems,
  clinicalNotes,
  updateNotes,
  saving,
  error,
  submitting,
  onSaveDraft,
  onSubmit,
}: DiagnosticOrderFormProps) {
  const addTest = (test: TestCatalogItem) => {
    if (items.some((item) => item.testId === test.id)) return;
    updateItems([
      ...items,
      {
        testId: test.id,
        testName: test.name,
        category: test.category,
        priority: "routine",
      },
    ]);
  };

  const updateItem = (index: number, patch: Partial<DiagnosticOrderItem>) => {
    updateItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeItem = (index: number) => {
    updateItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-3 text-sm text-status-danger">
          {error}
        </p>
      )}

      <TestSearch onSelect={addTest} excludeIds={items.map((item) => item.testId)} />

      {items.length === 0 ? (
        <p className="rounded-card border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
          Search and add tests to build the diagnostic order.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <TestOrderItem
              key={item.testId}
              item={item}
              index={index}
              onChange={(patch) => updateItem(index, patch)}
              onRemove={() => removeItem(index)}
            />
          ))}
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-900">Clinical notes</span>
        <textarea
          className="min-h-[5rem] w-full rounded-btn border border-ink-300 bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-2 focus:outline-brand-600"
          value={clinicalNotes}
          onChange={(e) => updateNotes(e.target.value)}
          placeholder="e.g. Rule out fasting hyperglycaemia"
        />
      </label>

      <div className="flex flex-col gap-3 border-t border-ink-200 pt-4 sm:flex-row sm:items-center">
        <p className="flex-1 text-xs text-ink-500">
          {saving ? "Saving…" : items.length === 0 ? "Draft not saved yet" : "Draft saved"}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" size="lg" disabled={saving || submitting || items.length === 0} onClick={onSaveDraft}>
            Save Draft
          </Button>
          <Button size="lg" disabled={submitting || items.length === 0} onClick={onSubmit}>
            {submitting ? "Submitting..." : "Submit Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
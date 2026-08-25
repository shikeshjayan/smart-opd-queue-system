"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAsync } from "@/lib/use-async";
import { testById } from "@/services/diagnostics";
import type { DiagnosticOrderItem, DiagnosticResult, ResultValue, TestCatalogItem } from "@/services/diagnostics/types";
import { diagnosticsMockApi } from "@/features/diagnostics/api/diagnostics.mock";
import { useDiagnosticResultActions } from "@/features/diagnostics/hooks/useDiagnosticResults";
import { ResultForm } from "@/features/diagnostics/components/ResultForm";
import { DiagnosticResultView } from "@/features/diagnostics/components/DiagnosticResultView";
import { ResultStatusBadge } from "@/features/diagnostics/components/ResultStatus";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { emptyValuesFor, validateResultValues } from "@/features/diagnostics/utils/diagnostics-validation";

export default function LabResultEntryPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const { data, isLoading, error, reload } = useAsync(
    async () => {
      const order = await diagnosticsMockApi.getOrder(orderId);
      if (!order) return null;
      const results = await diagnosticsMockApi.listResultsForOrder(orderId);
      return { order, results };
    },
    [orderId]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Order not found."} onRetry={reload} />;
  }

  const { order, results } = data;

  if (order.status === "cancelled") {
    return <EmptyState title="Order cancelled" description="This order was cancelled and has no result workflow." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Result Entry</h1>
          <p className="mt-1 text-sm text-ink-500">
            {order.id} · {order.items.map((i) => i.testName).join(", ")}
          </p>
        </div>
        <Link
          href="/lab/results"
          className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
        >
          Back to Results
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        {order.items.map((item) => (
          <TestResultSection
            key={`${order.id}-${item.testId}`}
            orderId={order.id}
            item={item}
            results={results.filter((r) => r.testId === item.testId)}
            onChanged={reload}
          />
        ))}
      </div>
    </div>
  );
}

function TestResultSection({
  orderId,
  item,
  results,
  onChanged,
}: {
  orderId: string;
  item: DiagnosticOrderItem;
  results: DiagnosticResult[];
  onChanged: () => void;
}) {
  const { amend, running } = useDiagnosticResultActions();
  const test = testById(item.testId);
  const current = results.find((r) => r.status === "final" || r.status === "amended");
  const draft = results.find((r) => r.status === "draft");

  if (!test) return null;

  return (
    <section aria-labelledby={`test-${item.testId}`} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id={`test-${item.testId}`} className="text-lg font-semibold text-ink-900">
          {item.testName}
        </h2>
        <div className="flex items-center gap-2">
          {current && <ResultStatusBadge status={current.status} />}
          {current?.status === "final" && !draft && (
            <Button
              size="sm"
              variant="outline"
              disabled={running ? true : false}
              onClick={async () => {
                const ok = await amend(orderId, item.testId);
                if (ok) onChanged();
              }}
            >
              Amend Result
            </Button>
          )}
        </div>
      </div>

      {current && !draft ? (
        <DiagnosticResultView result={current} context={null} />
      ) : (
        <TestResultEntry
          key={`${orderId}-${item.testId}-${draft?.id ?? "new"}`}
          orderId={orderId}
          test={test}
          initialValues={draft ? draft.values : emptyValuesFor(test)}
          initialNotes={draft?.notes ?? ""}
          onFinalized={onChanged}
        />
      )}
      {draft && !current && <p className="mt-2 text-xs text-ink-500">Editing draft result.</p>}
    </section>
  );
}

function TestResultEntry({
  orderId,
  test,
  initialValues,
  initialNotes,
  onFinalized,
}: {
  orderId: string;
  test: TestCatalogItem;
  initialValues: ResultValue[];
  initialNotes: string;
  onFinalized: () => void;
}) {
  const [values, setValues] = useState<ResultValue[]>(initialValues);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { finalize } = useDiagnosticResultActions();

  const validation = validateResultValues(values, test.parameters);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await diagnosticsMockApi.saveResultDraft(orderId, test.id, values, notes || undefined);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!validation.valid) {
      setError(`Required values missing: ${validation.missing.join(", ")}.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const draft = await diagnosticsMockApi.saveResultDraft(orderId, test.id, values, notes || undefined);
      if (!draft) return;
      const finalized = await finalize(draft.id);
      if (!finalized) {
        setError("Unable to finalize result. Check that all fields are complete.");
        return;
      }
      onFinalized();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to finalize result");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResultForm
      test={test}
      values={values}
      onChangeValues={setValues}
      notes={notes}
      onChangeNotes={setNotes}
      saving={saving}
      submitting={submitting}
      actionError={error}
      onSaveDraft={() => void handleSave()}
      onFinalize={() => void handleFinalize()}
      canFinalize={validation.valid}
    />
  );
}
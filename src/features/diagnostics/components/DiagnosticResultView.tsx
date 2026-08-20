import type { ReactNode } from "react";
import type { DiagnosticResult } from "@/services/diagnostics/types";
import { ResultStatusBadge } from "./ResultStatus";
import { ResultTable } from "./ResultTable";

type DiagnosticResultViewProps = {
  result: DiagnosticResult;
  context?: ReactNode;
  showInternalNotes?: boolean;
  reviewerName?: string;
};

export function DiagnosticResultView({
  result,
  context,
  showInternalNotes = true,
  reviewerName,
}: DiagnosticResultViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {context}
      <div className="overflow-x-auto rounded-card border border-ink-200 bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 px-4 py-3">
          <p className="text-sm font-semibold text-ink-900">{result.testName}</p>
          <ResultStatusBadge status={result.status} />
        </div>
        <div className="p-4">
          <ResultTable values={result.values} />
        </div>
      </div>

      {showInternalNotes && result.notes?.trim() && (
        <p className="rounded-card border border-ink-200 bg-surface px-4 py-3 text-sm text-ink-700 shadow-card">
          <span className="font-medium text-ink-900">Notes:</span> {result.notes}
        </p>
      )}

      {result.finalizedAt && (
        <p className="text-xs text-ink-400">
          Reported {result.finalizedAt.slice(0, 10)}
          {result.reviewedAt ? " · " : ""}
          {result.reviewedAt && `Reviewed ${result.reviewedAt.slice(0, 10)}`}
          {reviewerName ? ` by ${reviewerName}` : ""}
        </p>
      )}
    </div>
  );
}
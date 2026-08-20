"use client";

import Link from "next/link";
import { use } from "react";
import { useAsync } from "@/lib/use-async";
import { diagnosticsMockApi } from "@/features/diagnostics/api/diagnostics.mock";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDiagnosticResultActions } from "@/features/diagnostics/hooks/useDiagnosticResults";
import { DiagnosticResultView } from "@/features/diagnostics/components/DiagnosticResultView";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { getPatient } from "@/services/data";

export default function DoctorResultDetailPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = use(params);
  const { user, can } = useAuth();
  const { data, isLoading, error, reload } = useAsync(
    async () => {
      const result = await diagnosticsMockApi.getResult(resultId);
      if (!result) return null;
      const order = await diagnosticsMockApi.getOrder(result.orderId);
      return { result, order };
    },
    [resultId]
  );
  const { review, running } = useDiagnosticResultActions();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Result not found."} onRetry={reload} />;
  }

  const { result, order } = data;
  const patientName = getPatient(result.patientId)?.name ?? "Patient";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{result.testName}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {patientName} · {order?.id ?? result.orderId}
            {order ? ` · ${order.hospitalName}` : ""}
          </p>
        </div>
        <Link
          href="/doctor/results"
          className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
        >
          Back to Results
        </Link>
      </div>

      <DiagnosticResultView
        result={result}
        context={
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
            <p className="text-sm text-ink-700">
              Prescribing doctor: {order?.doctorName ?? "—"}
            </p>
            {result.status !== "draft" && !result.reviewedAt && can("REVIEW_DIAGNOSTIC_RESULTS") && (
              <Button
                size="sm"
                disabled={running === `review:${result.id}`}
                onClick={async () => {
                  const ok = await review(result.id, user?.id ?? "doctor");
                  if (ok) reload();
                }}
              >
                {running === `review:${result.id}` ? "Reviewing..." : "Review Result"}
              </Button>
            )}
            {result.reviewedAt && (
              <p className="text-sm text-status-success">✓ Reviewed</p>
            )}
          </div>
        }
      />
    </div>
  );
}
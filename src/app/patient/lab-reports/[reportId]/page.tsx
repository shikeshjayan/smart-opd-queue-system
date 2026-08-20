"use client";

import Link from "next/link";
import { use } from "react";
import { useAsync } from "@/lib/use-async";
import { diagnosticsMockApi } from "@/features/diagnostics/api/diagnostics.mock";
import { DiagnosticResultView } from "@/features/diagnostics/components/DiagnosticResultView";
import { ResultStatusBadge } from "@/features/diagnostics/components/ResultStatus";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function PatientLabReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = use(params);
  const { data, isLoading, error, reload } = useAsync(
    async () => {
      const result = await diagnosticsMockApi.getResult(reportId);
      if (!result) return null;
      const order = await diagnosticsMockApi.getOrder(result.orderId);
      return { result, order };
    },
    [reportId]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Lab report not found."} onRetry={reload} />;
  }

  const { result, order } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{result.testName}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {order?.hospitalName ?? "Government Hospital"}
            {order?.departmentName ? ` · ${order.departmentName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ResultStatusBadge status={result.status} />
          <Link
            href="/patient/lab-reports"
            className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
          >
            Back to Lab Reports
          </Link>
        </div>
      </div>

      <RecordAccessNotice audience="patient" />

      <DiagnosticResultView
        result={result}
        showInternalNotes={false}
        context={
          <dl className="grid gap-x-6 gap-y-2 rounded-card border border-ink-200 bg-surface p-4 text-sm shadow-card sm:grid-cols-2">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-500">Laboratory</dt>
              <dd className="font-medium text-ink-900">{order?.hospitalName ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-500">Date</dt>
              <dd className="font-medium tabular-nums text-ink-900">
                {(result.finalizedAt ?? "").slice(0, 10) || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-500">Order</dt>
              <dd className="font-medium tabular-nums text-ink-900">{order?.id ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-500">Test type</dt>
              <dd className="font-medium capitalize text-ink-900">{result.category}</dd>
            </div>
          </dl>
        }
      />
    </div>
  );
}
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAsync } from "@/lib/use-async";
import { diagnosticsMockApi } from "@/features/diagnostics/api/diagnostics.mock";
import { ResultStatusBadge } from "@/features/diagnostics/components/ResultStatus";
import { ResultTable } from "@/features/diagnostics/components/ResultTable";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";

export default function DiagnosticReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, reload } = useAsync(
    async () => {
      const result = await diagnosticsMockApi.getResult(id);
      if (!result) return null;
      const order = await diagnosticsMockApi.getOrder(result.orderId);
      return { result, order };
    },
    [id]
  );

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-48 w-full" /></div>;
  if (error || !data) return <ErrorState message={error ?? "Report not found."} onRetry={reload} />;

  const { result, order } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/diagnostics/reports" className="text-sm font-medium text-brand-700 hover:underline">&larr; Reports</Link>
      </div>

      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{result.testName}</h2>
            <p className="text-sm text-ink-500">
              Order: {result.orderId} &middot; Patient: {result.patientId}
            </p>
            {order?.doctorName && (
              <p className="text-sm text-ink-500">Ordered by: {order.doctorName}</p>
            )}
          </div>
          <ResultStatusBadge status={result.status} />
        </div>
      </div>

      <RecordAccessNotice audience="doctor" />

      {result.findings && (
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <h3 className="font-semibold mb-1">Findings</h3>
          <p className="text-sm whitespace-pre-wrap">{result.findings}</p>
        </div>
      )}
      {result.impression && (
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <h3 className="font-semibold mb-1">Impression</h3>
          <p className="text-sm whitespace-pre-wrap">{result.impression}</p>
        </div>
      )}
      {result.values.length > 0 && (
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <h3 className="font-semibold mb-1">Values</h3>
          <ResultTable values={result.values} />
        </div>
      )}
      {result.notes && (
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <h3 className="font-semibold mb-1">Notes</h3>
          <p className="text-sm whitespace-pre-wrap">{result.notes}</p>
        </div>
      )}
      {result.critical?.parameters?.length ? (
        <div className="rounded-card border border-red-300 bg-red-50 p-4 shadow-card">
          <h3 className="font-semibold text-red-800 mb-1">Critical Result</h3>
          <p className="text-sm text-red-700">
            Critical values: {result.critical.parameters.map((p) => `${p.name}: ${p.value}`).join(", ")}
          </p>
          <p className="text-sm text-red-600 mt-1">
            {result.critical.acknowledgedByName
              ? `Acknowledged by ${result.critical.acknowledgedByName}`
              : "Awaiting acknowledgement"}
          </p>
        </div>
      ) : null}
    </div>
  );
}

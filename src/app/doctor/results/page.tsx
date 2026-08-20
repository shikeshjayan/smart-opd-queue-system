"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDoctorResults } from "@/features/diagnostics/hooks/useDiagnosticResults";
import { ResultStatusBadge } from "@/features/diagnostics/components/ResultStatus";
import { formatDate } from "@/features/medical-records/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

export default function DoctorResultsPage() {
  const { user } = useAuth();
  const doctorId = user?.id ?? "";
  const { data, isLoading, error, reload } = useDoctorResults(doctorId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;

  const unreviewed = (data ?? []).filter((entry) => !entry.result.reviewedAt);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Laboratory Results</h1>
        <p className="mt-1 text-sm text-ink-500">
          {unreviewed.length} result{unreviewed.length === 1 ? "" : "s"} awaiting review
        </p>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState title="No results" description="Finalized results for your ordered tests will appear here." />
      ) : (
        <ol className="flex flex-col gap-3">
          {data.map(({ order, result, patientName }) => {
            const isNew = !result.reviewedAt;
            return (
              <li key={result.id}>
                <Link
                  href={`/doctor/results/${result.id}`}
                  className="block rounded-card border border-ink-200 bg-surface px-4 py-3 shadow-card transition-colors hover:border-brand-600"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-900">
                        <span className={isNew ? "h-2 w-2 rounded-full bg-status-danger" : "h-2 w-2 rounded-full bg-transparent"} aria-hidden="true" />
                        {result.testName}
                        <span className="text-xs font-normal text-ink-500">· {patientName}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {order.id} · {formatDate((result.finalizedAt ?? "").slice(0, 10))} · {order.hospitalName}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <ResultStatusBadge status={result.status} />
                      <span className="text-xs text-ink-400">
                        {result.reviewedAt ? "Reviewed" : "Awaiting review"}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
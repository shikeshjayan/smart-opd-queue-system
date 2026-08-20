"use client";

import Link from "next/link";
import { useLabOverview } from "@/features/diagnostics/hooks/useDiagnosticResults";
import { DiagnosticOrderSummary } from "@/features/diagnostics/components/DiagnosticOrderSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

export default function LabResultsPage() {
  const { data, isLoading, error, reload } = useLabOverview();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load results."} onRetry={reload} />;
  }

  const awaiting = data.orders.filter(
    (o) => o.status === "processing" || o.status === "sample_collected"
  );
  const completed = data.orders.filter((o) => o.status === "completed");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Results</h1>
        <p className="mt-1 text-sm text-ink-500">Enter and finalize laboratory results</p>
      </div>

      <section aria-labelledby="awaiting-title">
        <h2 id="awaiting-title" className="text-lg font-semibold text-ink-900">
          Awaiting result entry
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {awaiting.length === 0 ? (
            <EmptyState title="Nothing awaiting entry" description="Orders in processing or collected are listed here." />
          ) : (
            awaiting.map((order) => (
              <DiagnosticOrderSummary
                key={order.id}
                order={order}
                patientName={data.patients[order.patientId] ?? "Patient"}
                actions={
                  <Link
                    href={`/lab/results/${order.id}`}
                    className="rounded-btn border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                  >
                    Enter results
                  </Link>
                }
              />
            ))
          )}
        </div>
      </section>

      <section aria-labelledby="completed-title">
        <h2 id="completed-title" className="text-lg font-semibold text-ink-900">
          Completed
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {completed.length === 0 ? (
            <p className="text-sm text-ink-500">No completed results.</p>
          ) : (
            completed.map((order) => (
              <DiagnosticOrderSummary
                key={order.id}
                order={order}
                patientName={data.patients[order.patientId] ?? "Patient"}
                actions={
                  <Link
                    href={`/lab/results/${order.id}`}
                    className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
                  >
                    View
                  </Link>
                }
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
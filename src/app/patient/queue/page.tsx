"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQueue } from "@/features/queue/hooks/useQueue";
import { QueueProgress } from "@/features/queue/components/QueueProgress";
import { QueueStatusBadge } from "@/features/queue/components/QueueStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { formatWait, formatWaitRange } from "@/features/patient/utils/format";
import Link from "next/link";

function QueueContent() {
  const searchParams = useSearchParams();
  const opdId = searchParams.get("opd") ?? "opd_001";
  const tokenId = searchParams.get("token") ?? "tok_001";

  const { data: snapshot, isLoading, error, reload } = useQueue(opdId, tokenId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/patient/dashboard"
        className="text-sm text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        &larr; Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-ink-900">Queue Status</h1>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !snapshot ? (
        <p className="text-sm text-ink-500">Queue information unavailable.</p>
      ) : (
        <>
          <div
            aria-label={`Your token is ${snapshot.tokenNumber}`}
            className="rounded-card bg-brand-700 p-6 text-center text-white shadow-token"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Your Token</p>
            <p className="mt-2 text-5xl font-bold tracking-tight">{snapshot.tokenNumber}</p>
            <p className="mt-1 text-sm text-brand-100">{snapshot.opdName}</p>
            <QueueStatusBadge status={snapshot.status} />
          </div>

          <dl className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-card border border-ink-200 bg-surface p-3 shadow-card">
              <dt className="text-xs text-ink-500">Currently Serving</dt>
              <dd className="mt-1 text-xl font-semibold text-ink-900">{snapshot.nowServing ?? "—"}</dd>
            </div>
            <div className="rounded-card border border-ink-200 bg-surface p-3 shadow-card">
              <dt className="text-xs text-ink-500">Patients Ahead</dt>
              <dd className="mt-1 text-xl font-semibold text-ink-900">{snapshot.patientsAhead}</dd>
            </div>
            <div className="rounded-card border border-ink-200 bg-surface p-3 shadow-card">
              <dt className="text-xs text-ink-500">Estimated Waiting</dt>
              <dd className="mt-1 text-xl font-semibold text-ink-900">
                {snapshot.estimatedWaitMinutes != null ? formatWait(snapshot.estimatedWaitMinutes) : "—"}
              </dd>
            </div>
          </dl>

          {snapshot.estimatedWaitMinutes != null && (
            <p className="text-center text-sm text-ink-500">
              Approximate range: {formatWaitRange(snapshot.estimatedWaitMinutes)}
            </p>
          )}

          <section aria-labelledby="queue-progress-title">
            <h2 id="queue-progress-title" className="mb-3 text-lg font-semibold text-ink-900">
              Queue Progress
            </h2>
            {snapshot.entries.length > 0 ? (
              <QueueProgress entries={snapshot.entries} nowServing={snapshot.nowServing} />
            ) : (
              <p className="text-sm text-ink-500">No queue data available for this OPD.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function QueuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      }
    >
      <QueueContent />
    </Suspense>
  );
}

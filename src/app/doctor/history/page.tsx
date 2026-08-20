"use client";

import Link from "next/link";
import { useAsync } from "@/lib/use-async";
import { doctorMockApi } from "@/features/doctor/api/doctor.mock";
import { formatDate } from "@/features/doctor/utils/format";
import { EncounterStatusBadge } from "@/features/encounter/components/EncounterStatusBadge";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorHistoryPage() {
  const { data: encounters, isLoading, error, reload } = useAsync(
    () => doctorMockApi.getHistory(),
    []
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !encounters) {
    return <ErrorState message={error ?? "Unable to load history."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Consultation History</h1>
        <p className="mt-1 text-sm text-ink-500">{encounters.length} consultations on record</p>
      </div>

      <section aria-labelledby="history-list-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="history-list-title" className="sr-only">
          Consultation history list
        </h2>
        {encounters.length === 0 ? (
          <p className="text-sm text-ink-500">No consultations yet.</p>
        ) : (
          <ol className="divide-y divide-ink-100">
            {encounters.map((encounter) => (
              <li key={encounter.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums text-ink-900">{encounter.tokenNumber}</span>
                    <div>
                      <p className="text-sm font-medium text-ink-900">{formatDate(encounter.date)}</p>
                      <p className="text-xs text-ink-500">
                        {encounter.departmentName} &middot; {encounter.doctorName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EncounterStatusBadge status={encounter.status} />
                    <Link
                      href={`/doctor/consultation/${encounter.id}`}
                      className="rounded-btn border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

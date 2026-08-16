"use client";

import Link from "next/link";
import { DoctorStats } from "@/features/doctor/components/DoctorStats";
import { useOpdSummary } from "@/features/doctor/hooks/useDoctor";
import { OpdStatusBadge } from "@/features/opd/components/OpdStatusBadge";
import { formatTime } from "@/features/patient/utils/format";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorOpdPage() {
  const { data, isLoading, error, reload } = useOpdSummary();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load OPD summary."} onRetry={reload} />;
  }

  const { opd, counts, doctorName, hospitalName, departmentName } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Today&apos;s OPD</h1>
          <p className="mt-1 text-sm text-ink-500">
            {opd.name} &middot; {formatTime(opd.startTime)} – {formatTime(opd.endTime)}
          </p>
          <p className="mt-0.5 text-sm text-ink-500">
            {doctorName} &middot; {hospitalName}
          </p>
        </div>
        <OpdStatusBadge status={opd.status} />
      </div>

      <DoctorStats counts={counts} />

      <section aria-labelledby="opd-details-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="opd-details-title" className="text-lg font-semibold text-ink-900">
          Session Details
        </h2>
        <dl className="mt-3 divide-y divide-ink-100 text-sm">
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">OPD Name</dt>
            <dd className="font-medium text-ink-900">{opd.name}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Department</dt>
            <dd className="font-medium text-ink-900">{departmentName}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Hospital</dt>
            <dd className="font-medium text-ink-900">{hospitalName}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Timings</dt>
            <dd className="font-medium tabular-nums text-ink-900">
              {formatTime(opd.startTime)} – {formatTime(opd.endTime)}
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Total tokens</dt>
            <dd className="font-medium tabular-nums text-ink-900">{counts.total}</dd>
          </div>
        </dl>

        <Link
          href="/doctor/queue"
          className="mt-4 inline-flex h-10 items-center rounded-btn bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Go to Queue
        </Link>
      </section>
    </div>
  );
}

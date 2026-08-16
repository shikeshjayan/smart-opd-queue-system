"use client";

import { CurrentPatientCard } from "@/features/doctor/components/CurrentPatientCard";
import { OPDSummary } from "@/features/doctor/components/OPDSummary";
import { QueueSummary } from "@/features/doctor/components/QueueSummary";
import { useDoctorDashboard } from "@/features/doctor/hooks/useDoctor";
import { getGreeting } from "@/features/doctor/utils/format";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorDashboardPage() {
  const { data, isLoading, error, reload } = useDoctorDashboard();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load dashboard."} onRetry={reload} />;
  }

  const { doctor, opd, counts, current, waitingPreview } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">
          {getGreeting()}, {doctor.name}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {doctor.speciality} &middot; {doctor.hospitalName}
        </p>
      </div>

      <OPDSummary
        opd={opd}
        doctorName={doctor.name}
        counts={{
          total: counts.total,
          completed: counts.completed,
          waiting: counts.waiting,
          skipped: counts.skipped,
        }}
      />

      {current ? (
        <CurrentPatientCard
          entry={current.entry}
          patient={current.patient}
          encounterId={current.encounterId}
        />
      ) : (
        <section
          aria-labelledby="no-current-title"
          className="rounded-card border border-ink-200 bg-surface p-5 shadow-card"
        >
          <h2 id="no-current-title" className="text-lg font-semibold text-ink-900">
            Current Patient
          </h2>
          <p className="mt-2 text-sm text-ink-500">No patient in consultation right now.</p>
        </section>
      )}

      <QueueSummary entries={waitingPreview} />
    </div>
  );
}

"use client";

import { use } from "react";
import { EncounterCard } from "@/features/medical-records/components/EncounterCard";
import { MedicalSummary } from "@/features/medical-records/components/MedicalSummary";
import { MedicalTimeline } from "@/features/medical-records/components/MedicalTimeline";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { useDoctorPatient } from "@/features/medical-records/hooks/useMedicalRecords";
import { formatDate } from "@/features/doctor/utils/format";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorPatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  const { data, isLoading, error, reload } = useDoctorPatient(patientId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Patient not found."} onRetry={reload} />;
  }

  const { patient, summary, encounters } = data;
  const recentEncounters = encounters.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{patient.name}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {patient.id} &middot; {patient.age} years &middot; {patient.gender} &middot;{" "}
          {patient.bloodGroup ?? "Unknown blood group"}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink-900">Important Information</h2>
        <div className="-mt-4">
          <RecordAccessNotice audience="doctor" />
        </div>
        <MedicalSummary summary={summary} />
      </div>

      <section aria-labelledby="recent-encounters-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="recent-encounters-title" className="text-lg font-semibold text-ink-900">
            Recent Encounters
          </h2>
          <a
            href="#full-history"
            className="rounded-btn border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            View Full History
          </a>
        </div>
        {recentEncounters.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">No encounters on record.</p>
        ) : (
          <ol className="mt-3 flex flex-col gap-3">
            {recentEncounters.map((encounter) => (
              <EncounterCard
                key={encounter.id}
                encounter={encounter}
                href={`/doctor/patients/${patient.id}/encounters/${encounter.id}`}
              />
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="full-history-title" id="full-history">
        <h2 id="full-history-title" className="text-lg font-semibold text-ink-900">
          Full History
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          {encounters.length} encounters across {new Set(encounters.map((e) => e.hospitalName)).size}{" "}
          hospitals. Latest visit: {encounters.length > 0 ? formatDate(encounters[0].date) : "—"}.
        </p>
        <div className="mt-4">
          <MedicalTimeline
            encounters={encounters}
            detailHref={(encounterId) => `/doctor/patients/${patient.id}/encounters/${encounterId}`}
          />
        </div>
      </section>
    </div>
  );
}
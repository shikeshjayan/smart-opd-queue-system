"use client";

import Link from "next/link";
import { use } from "react";
import { usePatient } from "@/features/doctor/hooks/useDoctor";
import { formatDate } from "@/features/doctor/utils/format";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorPatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  const { data, isLoading, error, reload } = usePatient(patientId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data?.patient) {
    return <ErrorState message={error ?? "Patient not found."} onRetry={reload} />;
  }

  const { patient, encounters } = data;
  const currentVisit = encounters[0];
  const previousVisits = encounters.slice(1);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{patient.name}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {patient.id} &middot; {patient.age} yrs &middot; {patient.gender}
        </p>
      </div>

      <section aria-labelledby="patient-summary-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="patient-summary-title" className="text-lg font-semibold text-ink-900">
          Patient Summary
        </h2>
        <dl className="mt-3 divide-y divide-ink-100 text-sm">
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Phone</dt>
            <dd className="font-medium tabular-nums text-ink-900">{patient.phone}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Blood group</dt>
            <dd className="font-medium text-ink-900">{patient.bloodGroup ?? "—"}</dd>
          </div>
          {currentVisit && (
            <>
              <div className="flex justify-between py-2">
                <dt className="text-ink-500">Current token</dt>
                <dd className="font-medium tabular-nums text-ink-900">{currentVisit.tokenNumber}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-ink-500">Department</dt>
                <dd className="font-medium text-ink-900">{currentVisit.departmentName}</dd>
              </div>
            </>
          )}
        </dl>
      </section>

      <section aria-labelledby="known-info-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="known-info-title" className="text-lg font-semibold text-ink-900">
          Known Information
        </h2>
        <dl className="mt-3 space-y-4 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Allergies</dt>
            <dd className="mt-1 text-ink-900">
              {patient.knownInfo.allergies.length > 0 ? patient.knownInfo.allergies.join(", ") : "None recorded"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Medications</dt>
            <dd className="mt-1 text-ink-900">
              {patient.knownInfo.medications.length > 0 ? patient.knownInfo.medications.join(", ") : "None recorded"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Conditions</dt>
            <dd className="mt-1 text-ink-900">
              {patient.knownInfo.conditions.length > 0 ? patient.knownInfo.conditions.join(", ") : "None recorded"}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="previous-visits-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <h2 id="previous-visits-title" className="text-lg font-semibold text-ink-900">
          Previous Visits
        </h2>
        {previousVisits.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">No previous visits.</p>
        ) : (
          <ol className="mt-3 divide-y divide-ink-100">
            {previousVisits.map((encounter) => (
              <li key={encounter.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">{formatDate(encounter.date)}</p>
                  <p className="text-xs text-ink-500">
                    {encounter.departmentName} &middot; Token {encounter.tokenNumber}
                  </p>
                </div>
                <Link
                  href={`/doctor/consultation/${encounter.id}`}
                  className="rounded-btn border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600"
                >
                  View Details
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

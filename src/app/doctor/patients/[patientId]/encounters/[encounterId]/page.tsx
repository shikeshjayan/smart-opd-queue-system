"use client";

import Link from "next/link";
import { use } from "react";
import { EncounterDetailView } from "@/features/medical-records/components/EncounterDetailView";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { useDoctorEncounterDetail } from "@/features/medical-records/hooks/useMedicalRecords";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorEncounterChroniclePage({
  params,
}: {
  params: Promise<{ patientId: string; encounterId: string }>;
}) {
  const { patientId, encounterId } = use(params);
  const { data, isLoading, error, reload } = useDoctorEncounterDetail(patientId, encounterId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Encounter not found."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Encounter</h1>
          <p className="mt-1 text-sm text-ink-500">
            {data.encounter.departmentName} &middot; {data.encounter.hospitalName}
          </p>
        </div>
        <Link
          href={`/doctor/patients/${patientId}`}
          className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          Back to Patient
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <div>
            <p className="text-sm font-medium text-ink-900">{data.encounter.doctorName}</p>
            <p className="text-xs text-ink-500">
              #{data.encounter.id} &middot; Accessed during this consultation
            </p>
          </div>
          <span className="text-xs font-medium uppercase tracking-wide text-ink-400">Chronicle</span>
        </div>
        <RecordAccessNotice audience="doctor" />
      </div>

      <EncounterDetailView detail={data} />
    </div>
  );
}
"use client";

import Link from "next/link";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { PrescribedMedicineView } from "@/features/prescription/components/PrescribedMedicineView";
import { PrescriptionStatus } from "@/features/prescription/components/PrescriptionStatus";
import { usePatientPrescription } from "@/features/prescription/hooks/usePrescriptions";
import { printPrescription } from "@/features/prescription/utils/print";
import { patientNameFor } from "@/services/prescription";
import { formatLongDate } from "@/features/medical-records/utils/format";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ prescriptionId: string }>;
}) {
  const { prescriptionId } = use(params);
  const { data, isLoading, error, reload } = usePatientPrescription(prescriptionId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Prescription not found."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Prescription</h1>
          <p className="mt-1 text-sm text-ink-500">
            {formatLongDate((data.finalizedAt ?? data.createdAt).slice(0, 10))} · #{data.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrescriptionStatus prescription={data} />
          <Link
            href="/patient/prescriptions"
            className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
          >
            Back
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => printPrescription(data, patientNameFor(data.patientId), data.patientId)}
          >
            Print
          </Button>
        </div>
      </div>

      <RecordAccessNotice audience="patient" />

      <PrescribedMedicineView prescription={data} />
    </div>
  );
}
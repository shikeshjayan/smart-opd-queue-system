"use client";

import { use } from "react";
import { PatientHeader } from "@/features/consultation/components/PatientHeader";
import { DocumentsWorkspace } from "@/features/medical-documents/components/DocumentsWorkspace";
import { useDoctorPatient } from "@/features/medical-records/hooks/useMedicalRecords";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function DoctorPatientDocumentsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  const patientView = useDoctorPatient(patientId);

  if (patientView.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (patientView.error || !patientView.data) {
    return <ErrorState message={patientView.error ?? "Patient not found."} onRetry={patientView.reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PatientHeader patient={patientView.data.patient} />
      <DocumentsWorkspace patientId={patientId} audience="doctor" />
    </div>
  );
}
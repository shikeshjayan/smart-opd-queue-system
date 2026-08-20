"use client";

import Link from "next/link";
import { useState } from "react";
import { Pagination } from "@/features/medical-records/components/Pagination";
import { PrescriptionSummary } from "@/features/prescription/components/PrescriptionSummary";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { usePatientPrescriptions } from "@/features/prescription/hooks/usePrescriptions";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 5;

export default function PatientPrescriptionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, reload } = usePatientPrescriptions(page, PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load prescriptions."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Prescriptions</h1>
        <p className="mt-1 text-sm text-ink-500">{data.total} prescriptions on record</p>
      </div>

      <RecordAccessNotice audience="patient" />

      {data.items.length === 0 ? (
        <EmptyState title="No prescriptions yet" description="Prescriptions issued at your visits will appear here." />
      ) : (
        <>
          <ol className="flex flex-col gap-3">
            {data.items.map((prescription) => (
              <li key={prescription.id}>
                <Link href={`/patient/prescriptions/${prescription.id}`} className="block">
                  <PrescriptionSummary prescription={prescription} />
                </Link>
              </li>
            ))}
          </ol>
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
"use client";

import Link from "next/link";
import { useState } from "react";
import { LabReportCard } from "@/features/medical-records/components/LabReportCard";
import { Pagination } from "@/features/medical-records/components/Pagination";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { useLabReports } from "@/features/medical-records/hooks/useMedicalRecords";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 5;

export default function PatientLabReportsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, reload } = useLabReports(page, PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load lab reports."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Laboratory Reports</h1>
        <p className="mt-1 text-sm text-ink-500">{data.total} reports on record</p>
      </div>

      <RecordAccessNotice audience="patient" />

      {data.items.length === 0 ? (
        <EmptyState title="No lab reports yet" description="Laboratory results from your visits will appear here." />
      ) : (
        <>
          <ol className="flex flex-col gap-3">
            {data.items.map((report) => (
              <li key={report.id}>
                <Link href={`/patient/lab-reports/${report.id}`} className="block">
                  <LabReportCard report={report} />
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
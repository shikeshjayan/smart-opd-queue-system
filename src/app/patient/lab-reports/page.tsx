"use client";

import { usePatientTests } from "@/features/diagnostics/hooks/useDiagnosticResults";
import { DiagnosticTimeline } from "@/features/diagnostics/components/DiagnosticTimeline";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function PatientLabReportsPage() {
  const { user } = useAuth();
  const { data, isLoading, error, reload } = usePatientTests(user?.id ?? "");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error ?? "Unable to load lab reports."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Laboratory Reports</h1>
        <p className="mt-1 text-sm text-ink-500">
          {data?.length ?? 0} diagnostic tests on record
        </p>
      </div>

      <RecordAccessNotice audience="patient" />

      {!data || data.length === 0 ? (
        <EmptyState
          title="No lab reports yet"
          description="Laboratory results from your visits will appear here."
        />
      ) : (
        <DiagnosticTimeline
          entries={data}
          hrefFor={(entry) => `/patient/lab-reports/${entry.resultId!}`}
        />
      )}
    </div>
  );
}
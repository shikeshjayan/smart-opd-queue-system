"use client";

import { DocumentCard } from "@/features/medical-records/components/DocumentCard";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { useDocuments } from "@/features/medical-records/hooks/useMedicalRecords";
import { documentTypeLabel } from "@/features/medical-records/utils/format";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientDocumentsPage() {
  const { data, isLoading, error, reload } = useDocuments();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load documents."} onRetry={reload} />;
  }

  const types = [...new Set(data.map((d) => d.type))];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Medical Documents</h1>
        <p className="mt-1 text-sm text-ink-500">{data.length} documents on record</p>
      </div>

      <RecordAccessNotice audience="patient" />

      {data.length === 0 ? (
        <EmptyState title="No documents yet" description="Reports, prescriptions and certificates will appear here." />
      ) : (
        <div className="flex flex-col gap-6">
          {types.map((type) => (
            <section key={type} aria-labelledby={`docs-${type}-title`}>
              <h2 id={`docs-${type}-title`} className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                {documentTypeLabel(type)}
              </h2>
              <ul className="mt-2 flex flex-col gap-2">
                {data
                  .filter((d) => d.type === type)
                  .map((document) => (
                    <DocumentCard key={document.id} document={document} />
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
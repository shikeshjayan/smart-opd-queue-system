"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { useRecentDocuments } from "../hooks/useDocuments";
import type { MedicalDocument } from "../types/medical-document.types";
import { DocumentList } from "./DocumentList";
import { DocumentViewer } from "./DocumentViewer";

type RecentDocumentsProps = {
  patientId: string;
  viewAllHref?: string;
  limit?: number;
};

export function RecentDocuments({ patientId, viewAllHref, limit = 5 }: RecentDocumentsProps) {
  const { user, can } = useAuth();
  const { data, isLoading, error, reload } = useRecentDocuments(patientId);
  const [selected, setSelected] = useState<MedicalDocument | null>(null);

  const isPatient = user?.role === "patient";
  const canDownload = isPatient ? can("DOWNLOAD_OWN_DOCUMENT") : can("DOWNLOAD_PATIENT_DOCUMENT");
  const canAmend = !isPatient && can("UPLOAD_PATIENT_DOCUMENT");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-3">
      <DocumentList
        documents={(data ?? []).slice(0, limit)}
        onOpen={setSelected}
        emptyTitle="No documents yet"
        emptyDescription={
          isPatient
            ? "Upload a previous medical record or reports from another hospital."
            : "Documents linked to this patient will appear here."
        }
      />
      {viewAllHref && (data?.length ?? 0) > limit && (
        <Link
          href={viewAllHref}
          className="self-start rounded-btn border border-brand-600 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
        >
          View all documents
        </Link>
      )}
      {selected && (
        <DocumentViewer
          document={selected}
          onClose={() => setSelected(null)}
          canDownload={canDownload}
          canAmend={canAmend}
        />
      )}
    </div>
  );
}
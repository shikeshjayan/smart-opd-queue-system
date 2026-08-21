"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { useDocuments, useDocumentActions } from "../hooks/useDocuments";
import type { DocumentAudience, DocumentFilters, DocumentSort, MedicalDocument } from "../types/medical-document.types";
import { DocumentFilters as DocumentFiltersView } from "./DocumentFilters";
import { DocumentList } from "./DocumentList";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentViewer } from "./DocumentViewer";

type DocumentsWorkspaceProps = {
  patientId: string;
  audience: DocumentAudience;
};

export function DocumentsWorkspace({ patientId, audience }: DocumentsWorkspaceProps) {
  const { can } = useAuth();
  const [filters, setFilters] = useState<DocumentFilters>({ keyword: "", status: "active" });
  const [sort, setSort] = useState<DocumentSort>("newest");
  const [selected, setSelected] = useState<MedicalDocument | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [amendTarget, setAmendTarget] = useState<MedicalDocument | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data, isLoading, error, reload } = useDocuments(patientId, filters, sort);
  const documentActions = useDocumentActions();

  const isPatient = audience === "patient";
  const canUpload = isPatient ? can("UPLOAD_OWN_DOCUMENT") : can("UPLOAD_PATIENT_DOCUMENT");
  const canDownload = isPatient ? can("DOWNLOAD_OWN_DOCUMENT") : can("DOWNLOAD_PATIENT_DOCUMENT");
  const canAmend = !isPatient && can("UPLOAD_PATIENT_DOCUMENT");

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleArchive = async (doc: MedicalDocument) => {
    await documentActions.archive(doc.id);
    if (documentActions.error) showToast(documentActions.error);
    else {
      showToast("Document archived.");
      reload();
    }
  };

  const handleRestore = async (doc: MedicalDocument) => {
    await documentActions.restore(doc.id);
    if (documentActions.error) showToast(documentActions.error);
    else {
      showToast("Document restored.");
      reload();
    }
  };

  const handleUploadDone = (doc: MedicalDocument | null) => {
    setUploadOpen(false);
    setAmendTarget(null);
    if (doc) {
      reload();
      setSelected(doc);
    }
  };

  const actionsFor = (doc: MedicalDocument) => {
    const isOwnForPatient = isPatient && doc.patientId === patientId;
    const canManageDoc = isOwnForPatient || !isPatient;
    if (!canManageDoc) return null;
    if (doc.status === "archived") {
      return (
        <Button size="sm" variant="ghost" onClick={() => handleRestore(doc)} disabled={documentActions.busy}>
          Restore
        </Button>
      );
    }
    return (
      <Button size="sm" variant="ghost" onClick={() => handleArchive(doc)} disabled={documentActions.busy}>
        Archive
      </Button>
    );
  };

  const documents = data?.items ?? [];
  const facets = {
    hospitals: data?.hospitals ?? [],
    encounters: data?.encounters ?? [],
    years: data?.years ?? [],
  };

  return (
    <div className="flex flex-col gap-4">
      <RecordAccessNotice audience={audience} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">
            {isPatient ? "My Medical Documents" : "Patient Documents"}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {data ? `${data.total} document${data.total === 1 ? "" : "s"} on record` : "Loading documents…"}
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setUploadOpen(true)}>Upload Document</Button>
        )}
      </div>

      <DocumentFiltersView
        filters={filters}
        onChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        hospitals={facets.hospitals}
        encounters={facets.encounters}
        years={facets.years}
        allowStatus={true}
      />

      {toast && (
        <p role="status" className="rounded-card border border-status-success-soft bg-status-success-soft px-3 py-2 text-sm text-status-success">
          {toast}
        </p>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents found"
          description={
            filters.keyword || filters.type || filters.category
              ? "Try adjusting your search or filters."
              : isPatient
                ? "Upload a previous medical record or reports from another hospital."
                : "Documents linked to this patient will appear here."
          }
          action={
            canUpload ? (
              <Button variant="outline" onClick={() => setUploadOpen(true)}>
                Upload Document
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DocumentList documents={documents} onOpen={setSelected} actionsFor={actionsFor} />
      )}

      {uploadOpen && !amendTarget && (
        <DocumentUpload
          patientId={patientId}
          onDone={handleUploadDone}
          onCancel={() => {
            setUploadOpen(false);
            setAmendTarget(null);
          }}
        />
      )}

      {uploadOpen && amendTarget && (
        <DocumentUpload
          patientId={patientId}
          amendTarget={amendTarget}
          onDone={handleUploadDone}
          onCancel={() => {
            setUploadOpen(false);
            setAmendTarget(null);
          }}
        />
      )}

      {selected && (
        <DocumentViewer
          document={selected}
          onClose={() => setSelected(null)}
          canDownload={canDownload}
          canAmend={canAmend}
          onAmend={(doc) => {
            setSelected(null);
            setAmendTarget(doc);
            setUploadOpen(true);
          }}
        />
      )}
    </div>
  );
}
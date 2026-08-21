"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAsync } from "@/lib/use-async";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { documentsMockApi } from "../api/documents.mock";
import { isPreviewable } from "../types/medical-document.types";
import type { MedicalDocument } from "../types/medical-document.types";
import { formatBytes } from "../utils/format";
import { DocumentMetadata } from "./DocumentMetadata";
import { DocumentAudit } from "./DocumentAudit";

type DocumentViewerProps = {
  document: MedicalDocument;
  onClose: () => void;
  canDownload: boolean;
  canAmend: boolean;
  onAmend?: (document: MedicalDocument) => void;
};

export function DocumentViewer({
  document,
  onClose,
  canDownload,
  canAmend,
  onAmend,
}: DocumentViewerProps) {
  return (
    <Dialog open onClose={onClose} title={document.title} className="max-w-4xl">
      <DocumentViewerContent
        key={document.id}
        document={document}
        onClose={onClose}
        canDownload={canDownload}
        canAmend={canAmend}
        onAmend={onAmend}
      />
    </Dialog>
  );
}

function DocumentViewerContent({
  document,
  onClose,
  canDownload,
  canAmend,
  onAmend,
}: DocumentViewerProps) {
  const { user, can } = useAuth();
  const [access, setAccess] = useState<{ url: string; mimeType: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const activeUrls = useRef<string[]>([]);

  const revokeAll = () => {
    activeUrls.current.forEach((url) => URL.revokeObjectURL(url));
    activeUrls.current = [];
  };

  const audit = useAsync(
    () =>
      user && can("VIEW_DOCUMENT_AUDIT")
        ? documentsMockApi.listAudit(user, document.id)
        : Promise.resolve(null),
    [user?.id, document.id]
  );

  useEffect(() => {
    let cancelled = false;
    documentsMockApi
      .requestSignedAccess(user!, document.id, "view")
      .then((result) => {
        if (cancelled) return;
        activeUrls.current.push(result.url);
        setAccess({ url: result.url, mimeType: result.mimeType });
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load document.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      revokeAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.id]);

  const handleDownload = async () => {
    if (!user) return;
    setDownloading(true);
    try {
      const result = await documentsMockApi.requestSignedAccess(user, document.id, "download");
      activeUrls.current.push(result.url);
      const ext = document.mimeType.includes("/")
        ? document.mimeType.split("/")[1].split(";")[0]
        : "file";
      const a = window.document.createElement("a");
      a.href = result.url;
      a.download = `${document.title.replace(/\s+/g, "_")}_${document.id}.${ext}`;
      window.document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const previewable = access ? isPreviewable(access.mimeType) : false;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex min-h-[18rem] flex-col items-center justify-center gap-4 rounded-card border border-ink-200 bg-surface-muted p-4">
        {loading ? (
          <div className="flex w-full flex-col gap-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-8 w-40 self-center" />
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-sm text-status-danger">{error}</p>
          </div>
        ) : access && previewable ? (
          <div className="max-h-[32rem] w-full overflow-auto bg-ink-100">
            {access.mimeType === "application/pdf" ? (
              <iframe src={access.url} title={document.title} className="h-[32rem] w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={access.url} alt={document.title} className="mx-auto max-w-full" />
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-ink-600">Preview unavailable for this file type.</p>
            {canDownload && (
              <p className="mt-1 text-xs text-ink-500">
                Use the download button to access {formatBytes(document.size)}.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-card border border-ink-200 p-4">
          <h3 className="mb-2 text-sm font-semibold text-ink-900">Document details</h3>
          <DocumentMetadata document={document} />
        </div>

        <div className="flex flex-wrap gap-2">
          {canDownload && (
            <Button size="sm" onClick={handleDownload} disabled={downloading || !!error}>
              {downloading ? "Preparing…" : "Download"}
            </Button>
          )}
          {canAmend && onAmend && (
            <Button size="sm" variant="outline" onClick={() => onAmend(document)}>
              Amend
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        {can("VIEW_DOCUMENT_AUDIT") && audit.data && audit.data.length > 0 && (
          <div className="rounded-card border border-ink-200 p-4">
            <h3 className="mb-2 text-sm font-semibold text-ink-900">Audit trail</h3>
            <DocumentAudit entries={audit.data} loading={audit.isLoading} />
          </div>
        )}
      </div>
    </div>
  );
}
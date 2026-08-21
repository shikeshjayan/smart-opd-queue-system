import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MedicalDocument } from "../types/medical-document.types";
import { documentTypeLabel, formatDate } from "../utils/format";
import { DocumentStatus } from "./DocumentStatus";

type DocumentCardProps = {
  document: MedicalDocument;
  onOpen: (document: MedicalDocument) => void;
  actions?: React.ReactNode;
};

export function DocumentCard({ document, onOpen, actions }: DocumentCardProps) {
  return (
    <li className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-ink-900">{document.title}</p>
            <DocumentStatus document={document} />
          </div>
          <p className="mt-0.5 text-sm text-ink-500">
            {formatDate(document.documentDate)} · {document.hospitalName ?? "External record"}
            {document.departmentName ? ` · ${document.departmentName}` : ""}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            {documentTypeLabel(document.type)} · Uploaded by {document.uploadedBy}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <Button size="sm" variant="outline" onClick={() => onOpen(document)}>
            View
          </Button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Badge variant="default">{documentTypeLabel(document.type)}</Badge>
      </div>
    </li>
  );
}
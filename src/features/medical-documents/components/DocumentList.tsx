import { EmptyState } from "@/components/feedback/empty-state";
import type { MedicalDocument } from "../types/medical-document.types";
import { DocumentCard } from "./DocumentCard";

type DocumentListProps = {
  documents: MedicalDocument[];
  onOpen: (document: MedicalDocument) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  actionsFor?: (document: MedicalDocument) => React.ReactNode;
};

export function DocumentList({
  documents,
  onOpen,
  emptyTitle = "No documents found",
  emptyDescription = "Uploaded reports, prescriptions and certificates will appear here.",
  actionsFor,
}: DocumentListProps) {
  if (documents.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <ol className="flex flex-col gap-3">
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onOpen={onOpen}
          actions={actionsFor?.(document)}
        />
      ))}
    </ol>
  );
}
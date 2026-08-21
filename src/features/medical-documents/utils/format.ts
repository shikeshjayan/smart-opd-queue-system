import { documentTypeConfig } from "../types/medical-document.types";
import type {
  DocumentSource,
  DocumentStatus,
  DocumentType,
  MedicalDocument,
} from "../types/medical-document.types";
import { formatBytes } from "./validation";

export function formatDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function documentTypeLabel(type: DocumentType): string {
  return documentTypeConfig(type).label;
}

export function sourceLabel(source: DocumentSource): string {
  const labels: Record<DocumentSource, string> = {
    system: "Hospital / Care team",
    patient_provided: "Patient-provided",
    external: "External source",
  };
  return labels[source] ?? source;
}

export function statusLabel(status: DocumentStatus): string {
  const labels: Record<DocumentStatus, string> = {
    active: "Active",
    archived: "Archived",
    deleted: "Deleted",
  };
  return labels[status] ?? status;
}

export function documentSummary(doc: MedicalDocument): string {
  const parts = [
    documentTypeLabel(doc.type),
    doc.documentDate ? formatDate(doc.documentDate) : "",
    doc.hospitalName ?? "",
  ].filter(Boolean);
  return parts.join(" · ");
}

export { formatBytes };

export type FileInfo = {
  mimeType: string;
  size: number;
  name: string;
};

export function fileDisplayName(doc: MedicalDocument, file: FileInfo): string {
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()
    : mimeExtension(file.mimeType);
  return `${doc.title.replace(/\s+/g, "_")}_${doc.id}.${extension ?? "file"}`;
}

function mimeExtension(mimeType: string): string | undefined {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  return map[mimeType];
}
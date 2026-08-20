import type {
  DocumentAccess,
  DocumentAuditAction,
  DocumentAuditEntry,
  DocumentCategory,
  DocumentFilters,
  DocumentListResult,
  DocumentMetadataPatch,
  DocumentSort,
  DocumentSource,
  DocumentStatus,
  DocumentType,
  DocumentTypeConfig,
  DocumentUploadFile,
  DocumentUploadInput,
  MedicalDocument,
  SignedDocumentAccess,
} from "@/services/medical-documents/types";
import {
  categoryForType,
  documentTypeConfig,
  DOCUMENT_TYPES,
} from "@/services/medical-documents/types";

export type {
  DocumentAccess,
  DocumentAuditAction,
  DocumentAuditEntry,
  DocumentCategory,
  DocumentFilters,
  DocumentListResult,
  DocumentMetadataPatch,
  DocumentSort,
  DocumentSource,
  DocumentStatus,
  DocumentType,
  DocumentTypeConfig,
  DocumentUploadFile,
  DocumentUploadInput,
  MedicalDocument,
  SignedDocumentAccess,
};
export { categoryForType, documentTypeConfig, DOCUMENT_TYPES };

export type DocumentAudience = "patient" | "doctor";

export function isPreviewable(mimeType: string): boolean {
  return mimeType.startsWith("image/") || mimeType === "application/pdf";
}
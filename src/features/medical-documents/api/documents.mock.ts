import { medicalDocumentsService } from "@/services/medical-documents";
import type { SessionUser } from "@/features/auth/types/auth.types";
import type {
  DocumentFilters,
  DocumentMetadataPatch,
  DocumentSort,
  DocumentUploadInput,
} from "../types/medical-document.types";

export const documentsMockApi = {
  listDocuments: (
    user: SessionUser,
    patientId: string,
    filters: DocumentFilters,
    sort: DocumentSort
  ) => medicalDocumentsService.listDocuments(user, patientId, filters, sort),

  listForHistory: (user: SessionUser, patientId: string) =>
    medicalDocumentsService.listForHistory(user, patientId),

  getDocument: (user: SessionUser, documentId: string) =>
    medicalDocumentsService.getDocument(user, documentId),

  uploadDocument: (user: SessionUser, input: DocumentUploadInput) =>
    medicalDocumentsService.uploadDocument(user, input),

  updateDocumentMetadata: (
    user: SessionUser,
    documentId: string,
    patch: DocumentMetadataPatch
  ) => medicalDocumentsService.updateDocumentMetadata(user, documentId, patch),

  archiveDocument: (user: SessionUser, documentId: string) =>
    medicalDocumentsService.archiveDocument(user, documentId),

  restoreDocument: (user: SessionUser, documentId: string) =>
    medicalDocumentsService.restoreDocument(user, documentId),

  amendDocument: (
    user: SessionUser,
    documentId: string,
    input: { title?: string; documentDate?: string; file?: DocumentUploadInput["file"] }
  ) => medicalDocumentsService.amendDocument(user, documentId, input),

  requestSignedAccess: (
    user: SessionUser,
    documentId: string,
    purpose: "view" | "download"
  ) => medicalDocumentsService.requestSignedAccess(user, documentId, purpose),

  listAudit: (user: SessionUser, documentId: string) =>
    medicalDocumentsService.listAudit(user, documentId),

  listTypesForRole: (role: SessionUser["role"]) => medicalDocumentsService.listTypesForRole(role),
};
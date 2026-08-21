import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/services/medical-documents";
import type { DocumentType, DocumentUploadFile } from "../types/medical-document.types";

export { MAX_FILE_SIZE };

export function isAllowedFile(file: Pick<File, "type" | "size">): boolean {
  return ALLOWED_MIME_TYPES.includes(file.type) && file.size > 0 && file.size <= MAX_FILE_SIZE;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileNameFrom(storageName: string, doc: { title: string; id: string }): string {
  const ext = storageName.includes(".") ? storageName.split(".").pop() : "";
  return `${doc.title.replace(/\s+/g, "_")}_${doc.id}${ext ? `.${ext}` : ""}`;
}

export type DocumentFormErrors = Record<string, string>;

export function validateUploadForm(input: {
  file: DocumentUploadFile | null;
  type: DocumentType | "";
  title: string;
  documentDate: string;
}): DocumentFormErrors {
  const errors: DocumentFormErrors = {};
  if (!input.file) {
    errors.file = "Please select a file.";
  } else if (input.file.size > MAX_FILE_SIZE) {
    errors.file = "File is too large. Maximum allowed size: 10 MB";
  } else if (!ALLOWED_MIME_TYPES.includes(input.file.type)) {
    errors.file = "File type not allowed. Use PDF, image, DOCX, XLSX or TXT files.";
  }
  if (!input.type) errors.type = "Select a document type.";
  if (!input.title.trim()) errors.title = "Title is required.";
  else if (input.title.trim().length > 200) errors.title = "Title must be 200 characters or fewer.";
  if (!input.documentDate) errors.documentDate = "Select a valid document date.";
  return errors;
}
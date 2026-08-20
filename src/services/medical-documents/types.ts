import type { UserRole } from "@/features/auth/types/auth.types";

export type DocumentType =
  | "lab_report"
  | "imaging_report"
  | "prescription"
  | "discharge_summary"
  | "referral"
  | "medical_certificate"
  | "previous_medical_record"
  | "other_clinical";

export type DocumentCategory = "lab" | "imaging" | "prescription" | "other";

export type DocumentStatus = "active" | "archived" | "deleted";

export type DocumentSource = "system" | "patient_provided" | "external";

export type DocumentAccess = {
  hospitalIds: string[];
  grantedUserIds?: string[];
};

export type MedicalDocument = {
  id: string;
  patientId: string;
  hospitalId?: string;
  encounterId?: string;
  type: DocumentType;
  category: DocumentCategory;
  title: string;
  fileId: string;
  mimeType: string;
  size: number;
  documentDate: string;
  hospitalName?: string;
  departmentName?: string;
  uploadedBy: string;
  uploadedById: string;
  uploadedByRole: UserRole;
  source: DocumentSource;
  version: number;
  amendedFrom?: string;
  amendmentOf?: string;
  status: DocumentStatus;
  archivedAt?: string;
  access: DocumentAccess;
  createdAt: string;
  updatedAt: string;
};

export type DocumentTypeConfig = {
  type: DocumentType;
  label: string;
  category: DocumentCategory;
  uploaderRoles: UserRole[];
  description?: string;
};

export const DOCUMENT_TYPES: readonly DocumentTypeConfig[] = [
  {
    type: "lab_report",
    label: "Lab Report",
    category: "lab",
    uploaderRoles: ["doctor", "lab_staff"],
    description: "Laboratory investigation results and reports.",
  },
  {
    type: "imaging_report",
    label: "Imaging Report",
    category: "imaging",
    uploaderRoles: ["doctor", "lab_staff"],
    description: "Radiology / imaging study reports.",
  },
  {
    type: "prescription",
    label: "Prescription",
    category: "prescription",
    uploaderRoles: ["doctor"],
    description: "Issued prescriptions and medication charts.",
  },
  {
    type: "discharge_summary",
    label: "Discharge Summary",
    category: "other",
    uploaderRoles: ["doctor"],
    description: "Discharge summary from an inpatient stay.",
  },
  {
    type: "referral",
    label: "Referral",
    category: "other",
    uploaderRoles: ["doctor"],
    description: "Referral or counter-referral letter.",
  },
  {
    type: "medical_certificate",
    label: "Medical Certificate",
    category: "other",
    uploaderRoles: ["doctor"],
    description: "Sick leave / fitness certificates.",
  },
  {
    type: "previous_medical_record",
    label: "Previous Medical Record",
    category: "other",
    uploaderRoles: ["doctor", "patient"],
    description: "Records from another hospital, provided by the patient.",
  },
  {
    type: "other_clinical",
    label: "Other Clinical Document",
    category: "other",
    uploaderRoles: ["doctor", "patient"],
    description: "Other supporting clinical documents.",
  },
];

export function documentTypeConfig(type: DocumentType): DocumentTypeConfig {
  return DOCUMENT_TYPES.find((c) => c.type === type) ?? DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1];
}

export function categoryForType(type: DocumentType): DocumentCategory {
  return documentTypeConfig(type).category;
}

export type DocumentAuditAction =
  | "uploaded"
  | "viewed"
  | "downloaded"
  | "metadata_updated"
  | "archived"
  | "restored"
  | "amended";

export type DocumentAuditEntry = {
  id: string;
  documentId: string;
  action: DocumentAuditAction;
  byId: string;
  byName: string;
  byRole: UserRole;
  at: string;
  note?: string;
};

export type DocumentFilters = {
  keyword: string;
  type?: DocumentType;
  category?: DocumentCategory;
  hospitalId?: string;
  encounterId?: string;
  status?: "active" | "archived";
  year?: string;
};

export type DocumentSort = "newest" | "oldest";

export type DocumentListResult = {
  items: MedicalDocument[];
  total: number;
  hospitals: { id: string; name: string }[];
  encounters: { id: string; label: string }[];
  years: string[];
};

export type DocumentUploadFile = {
  name: string;
  type: string;
  size: number;
  blob: Blob;
};

export type DocumentUploadInput = {
  patientId: string;
  type: DocumentType;
  title: string;
  documentDate: string;
  encounterId?: string;
  source: DocumentSource;
  file: DocumentUploadFile;
};

export type DocumentMetadataPatch = {
  title?: string;
  documentDate?: string;
  type?: DocumentType;
  encounterId?: string;
};

export type SignedDocumentAccess = {
  url: string;
  mimeType: string;
  expiresAt: string;
};
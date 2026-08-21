import type { SessionUser } from "@/features/auth/types/auth.types";
import type { UserRole } from "@/features/auth/types/auth.types";
import { getEncounter, getHospital, getPatient } from "../data";
import { fileStore } from "./file-store";
import type { StoredFile } from "./file-store";
import {
  categoryForType,
  documentTypeConfig,
  DOCUMENT_TYPES,
} from "./types";
import type {
  DocumentAuditAction,
  DocumentAuditEntry,
  DocumentFilters,
  DocumentListResult,
  DocumentMetadataPatch,
  DocumentSort,
  DocumentSource,
  DocumentUploadInput,
  MedicalDocument,
  SignedDocumentAccess,
} from "./types";

const delay = () => new Promise((resolve) => setTimeout(resolve, 280));

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

const META_KEY = "sh.medical-documents.meta";
const AUDIT_KEY = "sh.medical-documents.audit";
const SEEDED_KEY = "sh.medical-documents.seeded";

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

let docStore: MedicalDocument[] = [];
let auditStore: DocumentAuditEntry[] = [];
let initialized = false;
let seeding: Promise<void> | null = null;

const PATIENT_ID = "P10294";

const CGH = "Government Hospital Ernakulam";
const GH_ALUVA = "Government Hospital Aluva";
const GH_PERUMBAVOOR = "Government Hospital Perumbavoor";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function reportSvg(title: string, meta: string[]): Blob {
  const height = 110 + meta.length * 26;
  const rows = meta
    .map(
      (m, i) =>
        `<text x="32" y="${78 + i * 26}" font-size="14" fill="#3f4a5a" font-family="Arial, sans-serif">${escapeXml(
          m
        )}</text>`
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${height}" viewBox="0 0 600 ${height}">
  <rect width="600" height="${height}" fill="#ffffff"/>
  <rect width="600" height="44" fill="#0f766e"/>
  <text x="24" y="29" font-size="15" font-weight="bold" fill="#ffffff" font-family="Arial, sans-serif">Smart Health OPD — Medical Report</text>
  <text x="32" y="60" font-size="16" font-weight="bold" fill="#0f172a" font-family="Arial, sans-serif">${escapeXml(
    title
  )}</text>
  ${rows}
</svg>`;
  return new Blob([svg], { type: "image/svg+xml" });
}

function seedDocumentSeeds(): MedicalDocument[] {
  const now = (pastDays: number) => new Date(Date.now() - pastDays * 86400000).toISOString();
  const build = (
    seed: {
      id: string;
      type: MedicalDocument["type"];
      title: string;
      documentDate: string;
      hospitalId?: string;
      hospitalName?: string;
      departmentName?: string;
      encounterId?: string;
      uploadedBy: string;
      uploadedById: string;
      uploadedByRole: UserRole;
      source: DocumentSource;
      accessHospitalIds?: string[];
      createdAt?: string;
    }
  ): MedicalDocument => {
    const fileId = `file_${seed.id.toLowerCase()}`;
    const hospitalId = seed.hospitalId;
    return {
      id: seed.id,
      patientId: PATIENT_ID,
      hospitalId,
      encounterId: seed.encounterId ?? "",
      type: seed.type,
      category: categoryForType(seed.type),
      title: seed.title,
      fileId,
      mimeType: "image/svg+xml",
      size: 0,
      documentDate: seed.documentDate,
      hospitalName: seed.hospitalName,
      departmentName: seed.departmentName,
      uploadedBy: seed.uploadedBy,
      uploadedById: seed.uploadedById,
      uploadedByRole: seed.uploadedByRole,
      source: seed.source,
      version: 1,
      status: "active",
      access: {
        hospitalIds: seed.accessHospitalIds ?? (hospitalId ? [hospitalId] : []),
      },
      createdAt: seed.createdAt ?? now(30),
      updatedAt: seed.createdAt ?? now(30),
    };
  };

  return [
    build({
      id: "DOC20260816001",
      type: "lab_report",
      title: "CBC Report",
      documentDate: "2026-08-16",
      hospitalId: "hos_001",
      hospitalName: CGH,
      departmentName: "Cardiology",
      encounterId: "MR20260816001",
      uploadedBy: "Dr. Anil Kumar",
      uploadedById: "doc_001",
      uploadedByRole: "doctor",
      source: "system",
    }),
    build({
      id: "DOC20260816002",
      type: "lab_report",
      title: "ECG Report",
      documentDate: "2026-08-16",
      hospitalId: "hos_001",
      hospitalName: CGH,
      departmentName: "Cardiology",
      encounterId: "MR20260816001",
      uploadedBy: "Dr. Anil Kumar",
      uploadedById: "doc_001",
      uploadedByRole: "doctor",
      source: "system",
    }),
    build({
      id: "DOC20260818001",
      type: "imaging_report",
      title: "Chest X-Ray Report",
      documentDate: "2026-08-18",
      hospitalId: "hos_001",
      hospitalName: CGH,
      uploadedBy: "Sneha Nair",
      uploadedById: "lab_001",
      uploadedByRole: "lab_staff",
      source: "system",
    }),
    build({
      id: "DOC20260602001",
      type: "referral",
      title: "Referral Letter — Cardiology",
      documentDate: "2026-06-02",
      hospitalId: "hos_005",
      hospitalName: GH_ALUVA,
      departmentName: "General Medicine",
      encounterId: "MR20260602001",
      uploadedBy: "Dr. Suresh Pillai",
      uploadedById: "doc_005",
      uploadedByRole: "doctor",
      source: "system",
    }),
    build({
      id: "DOC20260418001",
      type: "prescription",
      title: "Prescription — Metformin (Apr 2026)",
      documentDate: "2026-04-18",
      hospitalId: "hos_006",
      hospitalName: GH_PERUMBAVOOR,
      departmentName: "General Medicine",
      encounterId: "MR20260418001",
      uploadedBy: "Dr. Meenakshi Warrier",
      uploadedById: "doc_008",
      uploadedByRole: "doctor",
      source: "system",
    }),
    build({
      id: "DOC20260112001",
      type: "prescription",
      title: "Routine Review Prescription",
      documentDate: "2026-01-12",
      hospitalId: "hos_001",
      hospitalName: CGH,
      departmentName: "Cardiology",
      encounterId: "MR20260112001",
      uploadedBy: "Dr. Anil Kumar",
      uploadedById: "doc_001",
      uploadedByRole: "doctor",
      source: "system",
    }),
    build({
      id: "DOC20250210001",
      type: "medical_certificate",
      title: "Medical Certificate — Sick Leave",
      documentDate: "2025-02-10",
      hospitalId: "hos_005",
      hospitalName: GH_ALUVA,
      uploadedBy: "Dr. Suresh Pillai",
      uploadedById: "doc_005",
      uploadedByRole: "doctor",
      source: "system",
    }),
    build({
      id: "DOC20250510001",
      type: "previous_medical_record",
      title: "Previous Cardiology Report",
      documentDate: "2025-05-10",
      uploadedBy: "Rahul K",
      uploadedById: PATIENT_ID,
      uploadedByRole: "patient",
      source: "patient_provided",
      accessHospitalIds: ["hos_001"],
    }),
    build({
      id: "DOC20190420001",
      type: "discharge_summary",
      title: "Discharge Summary — Right Wrist Fracture",
      documentDate: "2019-04-20",
      hospitalId: "hos_001",
      hospitalName: CGH,
      uploadedBy: "Admin Office",
      uploadedById: "adm_office",
      uploadedByRole: "hospital_admin",
      source: "system",
    }),
  ];
}

async function seedFiles(docs: MedicalDocument[]): Promise<void> {
  for (const doc of docs) {
    const existing = await fileStore.get(doc.fileId);
    if (existing) continue;
    const meta = [
      `Patient ID: ${doc.patientId}`,
      `Type: ${documentTypeConfig(doc.type).label}`,
      doc.documentDate ? `Date: ${doc.documentDate}` : "",
      doc.hospitalName ? `Hospital: ${doc.hospitalName}` : "",
      doc.uploadedBy ? `Prepared by: ${doc.uploadedBy}` : "",
    ].filter(Boolean);
    const blob = reportSvg(doc.title, meta);
    const file: StoredFile = {
      id: doc.fileId,
      mimeType: "image/svg+xml",
      size: blob.size,
      blob,
      createdAt: doc.createdAt,
    };
    await fileStore.put(file);
    doc.size = file.size;
  }
}

async function ensureSeeded(): Promise<void> {
  if (initialized) return;
  if (seeding) return seeding;
  seeding = (async () => {
    docStore = read<MedicalDocument[]>(META_KEY, []);
    auditStore = read<DocumentAuditEntry[]>(AUDIT_KEY, []);
    const seeded = read(SEEDED_KEY, false);
    if (seeded && docStore.length > 0) {
      initialized = true;
      return;
    }
    const docs = seedDocumentSeeds();
    docStore = docs;
    await seedFiles(docs);
    auditStore = docs.map((doc) => ({
      id: `aud_${doc.id}_upload`,
      documentId: doc.id,
      action: "uploaded" as DocumentAuditAction,
      byId: doc.uploadedById,
      byName: doc.uploadedBy,
      byRole: doc.uploadedByRole,
      at: doc.createdAt,
      note: "Seeded record",
    }));
    write(META_KEY, docStore);
    write(AUDIT_KEY, auditStore);
    write(SEEDED_KEY, true);
    initialized = true;
  })();
  return seeding;
}

function persistDocs(): void {
  write(META_KEY, docStore);
}

function persistAudit(): void {
  write(AUDIT_KEY, auditStore);
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${docStore.length + 1}`;
}

function appendAudit(
  documentId: string,
  action: DocumentAuditAction,
  user: SessionUser,
  note?: string
): void {
  auditStore.unshift({
    id: `aud_${Date.now()}_${auditStore.length + 1}`,
    documentId,
    action,
    byId: user.id,
    byName: user.name,
    byRole: user.role,
    at: new Date().toISOString(),
    note,
  });
  persistAudit();
}

function findDoc(documentId: string): MedicalDocument | undefined {
  return docStore.find((d) => d.id === documentId);
}

function userHospitalId(user: SessionUser): string | undefined {
  return user.scope?.hospitalId;
}

function canAccessDoc(user: SessionUser, doc: MedicalDocument): boolean {
  if (user.role === "patient") return doc.patientId === user.id;
  if (user.role === "doctor") {
    if (doc.access?.grantedUserIds?.includes(user.id)) return true;
    if (doc.hospitalId && doc.hospitalId === userHospitalId(user)) return true;
    if (!doc.hospitalId && doc.patientId) return true;
    if (doc.encounterId) {
      const encounter = resolveEncounter(doc.encounterId);
      if (encounter && encounter.doctorId === user.id) return true;
    }
    return false;
  }
  if (user.role === "lab_staff") {
    if (doc.category !== "lab" && doc.category !== "imaging") return false;
    if (doc.hospitalId && doc.hospitalId !== userHospitalId(user)) return false;
    return true;
  }
  if (user.role === "receptionist") return true;
  if (user.role === "hospital_admin") {
    if (doc.hospitalId && doc.hospitalId !== userHospitalId(user)) return false;
    return true;
  }
  return false;
}

type ResolvedEncounter = {
  encounterId: string;
  hospitalId: string;
  hospitalName: string;
  departmentName: string;
  doctorId: string;
  patientId: string;
};

const LEGACY_ENCOUNTERS: Record<string, Omit<ResolvedEncounter, "encounterId">> = {
  MR20260816001: {
    hospitalId: "hos_001",
    hospitalName: CGH,
    departmentName: "Cardiology",
    doctorId: "doc_001",
    patientId: PATIENT_ID,
  },
  MR20260810001: {
    hospitalId: "hos_001",
    hospitalName: CGH,
    departmentName: "General Medicine",
    doctorId: "doc_002",
    patientId: PATIENT_ID,
  },
  MR20260602001: {
    hospitalId: "hos_005",
    hospitalName: GH_ALUVA,
    departmentName: "General Medicine",
    doctorId: "doc_005",
    patientId: PATIENT_ID,
  },
  MR20260418001: {
    hospitalId: "hos_006",
    hospitalName: GH_PERUMBAVOOR,
    departmentName: "General Medicine",
    doctorId: "doc_008",
    patientId: PATIENT_ID,
  },
  MR20260112001: {
    hospitalId: "hos_001",
    hospitalName: CGH,
    departmentName: "Cardiology",
    doctorId: "doc_001",
    patientId: PATIENT_ID,
  },
  MR20251204001: {
    hospitalId: "hos_005",
    hospitalName: GH_ALUVA,
    departmentName: "General Medicine",
    doctorId: "doc_005",
    patientId: PATIENT_ID,
  },
  MR20250721001: {
    hospitalId: "hos_001",
    hospitalName: CGH,
    departmentName: "Cardiology",
    doctorId: "doc_001",
    patientId: PATIENT_ID,
  },
};

function resolveEncounter(encounterId?: string): ResolvedEncounter | undefined {
  if (!encounterId) return undefined;
  const live = getEncounter(encounterId);
  if (live) {
    return {
      encounterId: live.id,
      hospitalId: live.hospitalId,
      hospitalName: live.hospitalName,
      departmentName: live.departmentName,
      doctorId: live.doctorId,
      patientId: live.patientId,
    };
  }
  const legacy = LEGACY_ENCOUNTERS[encounterId];
  if (legacy) return { encounterId, ...legacy };
  return undefined;
}

function canViewFile(user: SessionUser, doc: MedicalDocument): boolean {
  if (user.role === "receptionist") return false;
  if (!canAccessDoc(user, doc)) return false;
  if (user.role === "hospital_admin" && userHospitalId(user) !== doc.hospitalId && doc.hospitalId) {
    return false;
  }
  return true;
}

function resolveEncounterContext(encounterId?: string) {
  const resolved = resolveEncounter(encounterId);
  if (!resolved) return undefined;
  return {
    encounterId: resolved.encounterId,
    hospitalId: resolved.hospitalId,
    hospitalName: resolved.hospitalName,
    departmentName: resolved.departmentName,
  };
}

function matchesFilters(doc: MedicalDocument, filters: DocumentFilters): boolean {
  if (filters.status && doc.status !== filters.status) return false;
  if (filters.type && doc.type !== filters.type) return false;
  if (filters.category && doc.category !== filters.category) return false;
  if (filters.hospitalId && doc.hospitalId !== filters.hospitalId) return false;
  if (filters.encounterId && doc.encounterId !== filters.encounterId) return false;
  if (filters.year && doc.documentDate.slice(0, 4) !== filters.year) return false;
  if (filters.keyword.trim()) {
    const needle = filters.keyword.trim().toLowerCase();
    const haystack = `${doc.title} ${documentTypeConfig(doc.type).label} ${
      doc.hospitalName ?? ""
    } ${doc.departmentName ?? ""}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

function validateUpload(user: SessionUser, input: DocumentUploadInput): void {
  if (!input.file || !input.file.blob) {
    throw new Error("Please select a file to upload.");
  }
  if (input.file.size > MAX_FILE_SIZE) {
    throw new Error("File is too large. Maximum allowed size: 10 MB");
  }
  if (!ALLOWED_MIME_TYPES.includes(input.file.type)) {
    throw new Error("File type not allowed. Use PDF, image, DOCX, XLSX or TXT files.");
  }
  const typeConfig = DOCUMENT_TYPES.find((c) => c.type === input.type);
  if (!typeConfig) throw new Error("Select a valid document type.");
  if (!typeConfig.uploaderRoles.includes(user.role)) {
    throw new Error("You don't have permission to upload this document type.");
  }
  if (user.role === "patient" && input.patientId !== user.id) {
    throw new Error("Patients can only upload to their own medical record.");
  }
  if (!input.title.trim()) throw new Error("Title is required.");
  if (input.title.trim().length > 200) throw new Error("Title must be 200 characters or fewer.");
  if (!input.documentDate || Number.isNaN(new Date(`${input.documentDate}T00:00:00`).getTime())) {
    throw new Error("Select a valid document date.");
  }
  if (input.encounterId) {
    const encounter = resolveEncounter(input.encounterId);
    if (!encounter || encounter.patientId !== input.patientId) {
      throw new Error("The selected encounter does not belong to this patient.");
    }
  }
}

export const medicalDocumentsService = {
  async listDocuments(
    user: SessionUser,
    patientId: string,
    filters: DocumentFilters,
    sort: DocumentSort
  ): Promise<DocumentListResult> {
    await ensureSeeded();
    await delay();
    let scoped = docStore.filter(
      (d) => d.patientId === patientId && d.status !== "deleted" && canAccessDoc(user, d)
    );
    scoped = scoped.filter((d) => matchesFilters(d, filters));
    scoped.sort((a, b) =>
      sort === "oldest"
        ? a.documentDate.localeCompare(b.documentDate) || a.createdAt.localeCompare(b.createdAt)
        : b.documentDate.localeCompare(a.documentDate) || b.createdAt.localeCompare(a.createdAt)
    );
    return {
      items: scoped,
      total: scoped.length,
      hospitals: Array.from(
        new Map(
          scoped
            .filter((d) => d.hospitalId)
            .map((d) => [d.hospitalId!, { id: d.hospitalId!, name: d.hospitalName ?? d.hospitalId! }])
        ).values()
      ),
      encounters: Array.from(
        new Map(
          scoped
            .filter((d) => d.encounterId)
            .map((d) => [d.encounterId!, { id: d.encounterId!, label: `${d.documentDate} · ${d.departmentName ?? "Encounter"}` }])
        ).values()
      ),
      years: Array.from(new Set(scoped.map((d) => d.documentDate.slice(0, 4)))).sort((a, b) =>
        b.localeCompare(a)
      ),
    };
  },

  async listForHistory(user: SessionUser, patientId: string): Promise<MedicalDocument[]> {
    await ensureSeeded();
    await delay();
    return docStore
      .filter(
        (d) =>
          d.patientId === patientId &&
          d.status === "active" &&
          canAccessDoc(user, d)
      )
      .sort((a, b) => b.documentDate.localeCompare(a.documentDate) || b.createdAt.localeCompare(a.createdAt));
  },

  async getDocument(user: SessionUser, documentId: string): Promise<MedicalDocument | null> {
    await ensureSeeded();
    await delay();
    const doc = findDoc(documentId);
    if (!doc || !canAccessDoc(user, doc)) return null;
    return { ...doc };
  },

  async uploadDocument(
    user: SessionUser,
    input: DocumentUploadInput
  ): Promise<MedicalDocument> {
    await ensureSeeded();
    validateUpload(user, input);
    const encounterContext = resolveEncounterContext(input.encounterId);
    const clinicHospitalId =
      encounterContext?.hospitalId ?? userHospitalId(user);
    const clinicHospitalName = encounterContext?.hospitalName
      ?? (clinicHospitalId ? getHospital(clinicHospitalId)?.name : undefined);
    const patient = getPatient(input.patientId);

    const fileId = nextId("file").toLowerCase();
    await fileStore.put({
      id: fileId,
      mimeType: input.file.type,
      size: input.file.size,
      blob: input.file.blob,
      createdAt: new Date().toISOString(),
    });

    const source: DocumentSource =
      user.role === "patient" ? "patient_provided" : input.source || "system";

    const accessHospitalIds =
      source === "patient_provided" && !clinicHospitalId
        ? (patient?.registeredHospitalId ? [patient.registeredHospitalId] : [])
        : (clinicHospitalId ? [clinicHospitalId] : []);

    const doc: MedicalDocument = {
      id: nextId("DOC"),
      patientId: input.patientId,
      hospitalId: clinicHospitalId,
      encounterId: input.encounterId ?? "",
      type: input.type,
      category: categoryForType(input.type),
      title: input.title.trim(),
      fileId,
      mimeType: input.file.type,
      size: input.file.size,
      documentDate: input.documentDate,
      hospitalName: clinicHospitalName,
      departmentName: encounterContext?.departmentName,
      uploadedBy: user.name,
      uploadedById: user.id,
      uploadedByRole: user.role,
      source,
      version: 1,
      status: "active",
      access: { hospitalIds: accessHospitalIds },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    docStore.unshift(doc);
    persistDocs();
    appendAudit(doc.id, "uploaded", user, `${input.file.name} (${documentTypeConfig(input.type).label})`);
    return { ...doc };
  },

  async updateDocumentMetadata(
    user: SessionUser,
    documentId: string,
    patch: DocumentMetadataPatch
  ): Promise<MedicalDocument | undefined> {
    await ensureSeeded();
    await delay();
    const doc = findDoc(documentId);
    if (!doc || !canAccessDoc(user, doc)) throw new Error("Document not found or not accessible.");
    const patientCanEdit = user.role === "patient" && doc.patientId === user.id && doc.source === "patient_provided";
    const staffCanEdit =
      (user.role === "doctor" && doc.hospitalId === userHospitalId(user)) ||
      user.role === "hospital_admin";
    if (!patientCanEdit && !staffCanEdit) {
      throw new Error("You don't have permission to edit this document.");
    }
    const updated = { ...doc };
    if (patch.title !== undefined) {
      if (!patch.title.trim()) throw new Error("Title is required.");
      updated.title = patch.title.trim();
    }
    if (patch.documentDate !== undefined) {
      if (Number.isNaN(new Date(`${patch.documentDate}T00:00:00`).getTime())) {
        throw new Error("Select a valid document date.");
      }
      updated.documentDate = patch.documentDate;
    }
    if (patch.type !== undefined) {
      const typeConfig = DOCUMENT_TYPES.find((c) => c.type === patch.type);
      if (!typeConfig) throw new Error("Select a valid document type.");
      updated.type = patch.type;
      updated.category = categoryForType(patch.type);
    }
    if (patch.encounterId !== undefined) {
      const context = resolveEncounterContext(patch.encounterId || undefined);
      if (patch.encounterId && !context) {
        throw new Error("The selected encounter does not belong to this patient.");
      }
      updated.encounterId = patch.encounterId || "";
      updated.hospitalId = context?.hospitalId ?? updated.hospitalId;
      updated.hospitalName = context?.hospitalName ?? updated.hospitalName;
      updated.departmentName = context?.departmentName;
      if (updated.hospitalId && !updated.access.hospitalIds.includes(updated.hospitalId)) {
        updated.access.hospitalIds = [...updated.access.hospitalIds, updated.hospitalId];
      }
    }
    updated.updatedAt = new Date().toISOString();
    const index = docStore.findIndex((d) => d.id === documentId);
    docStore[index] = updated;
    persistDocs();
    appendAudit(documentId, "metadata_updated", user, "Metadata corrected.");
    return { ...updated };
  },

  async archiveDocument(user: SessionUser, documentId: string): Promise<MedicalDocument | undefined> {
    await ensureSeeded();
    await delay();
    const doc = findDoc(documentId);
    if (!doc || !canAccessDoc(user, doc)) return undefined;
    const patientCanArchive = user.role === "patient" && doc.patientId === user.id;
    if (!patientCanArchive && user.role !== "hospital_admin" && user.role !== "doctor") {
      throw new Error("You don't have permission to archive this document.");
    }
    if (doc.status !== "active") throw new Error("Only active documents can be archived.");
    doc.status = "archived";
    doc.archivedAt = new Date().toISOString();
    doc.updatedAt = new Date().toISOString();
    persistDocs();
    appendAudit(documentId, "archived", user, "Archived — no hard delete.");
    return { ...doc };
  },

  async restoreDocument(user: SessionUser, documentId: string): Promise<MedicalDocument | undefined> {
    await ensureSeeded();
    await delay();
    const doc = findDoc(documentId);
    if (!doc || !canAccessDoc(user, doc)) return undefined;
    const patientCanRestore = user.role === "patient" && doc.patientId === user.id;
    if (!patientCanRestore && user.role !== "hospital_admin" && user.role !== "doctor") {
      throw new Error("You don't have permission to restore this document.");
    }
    if (doc.status !== "archived") throw new Error("Only archived documents can be restored.");
    doc.status = "active";
    doc.archivedAt = undefined;
    doc.updatedAt = new Date().toISOString();
    persistDocs();
    appendAudit(documentId, "restored", user);
    return { ...doc };
  },

  async amendDocument(
    user: SessionUser,
    documentId: string,
    input: { title?: string; documentDate?: string; file?: DocumentUploadInput["file"] }
  ): Promise<MedicalDocument | undefined> {
    await ensureSeeded();
    await delay();
    const original = findDoc(documentId);
    if (!original || !canAccessDoc(user, original)) return undefined;
    if (user.role !== "doctor" && user.role !== "hospital_admin") {
      throw new Error("Only clinical staff can amend a document.");
    }
    if (input.file) {
      validateUpload(user, {
        patientId: original.patientId,
        type: original.type,
        title: input.title ?? original.title,
        documentDate: input.documentDate ?? original.documentDate,
        encounterId: original.encounterId || undefined,
        source: original.source,
        file: input.file,
      });
    } else if (!input.title || !input.documentDate) {
      throw new Error("Provide an amended file or corrected title and date.");
    }
    const fileId = nextId("file").toLowerCase();
    if (input.file) {
      await fileStore.put({
        id: fileId,
        mimeType: input.file.type,
        size: input.file.size,
        blob: input.file.blob,
        createdAt: new Date().toISOString(),
      });
    }
    const amendment: MedicalDocument = {
      ...original,
      id: nextId("DOC"),
      title: (input.title ?? original.title).trim(),
      documentDate: input.documentDate ?? original.documentDate,
      fileId,
      mimeType: input.file?.type ?? original.mimeType,
      size: input.file?.size ?? original.size,
      version: original.version + 1,
      amendedFrom: original.id,
      amendmentOf: undefined,
      status: "active",
      uploadedBy: user.name,
      uploadedById: user.id,
      uploadedByRole: user.role,
      source: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: undefined,
    };
    original.amendmentOf = amendment.id;
    original.updatedAt = new Date().toISOString();
    docStore.unshift(amendment);
    persistDocs();
    appendAudit(amendment.id, "amended", user, `Amendment of ${original.id} (v${original.version}).`);
    return { ...amendment };
  },

  async requestSignedAccess(
    user: SessionUser,
    documentId: string,
    purpose: "view" | "download"
  ): Promise<SignedDocumentAccess> {
    await ensureSeeded();
    await delay();
    const doc = findDoc(documentId);
    if (!doc || !canViewFile(user, doc)) {
      throw new Error("You don't have permission to view this document.");
    }
    if (doc.status === "archived") {
      throw new Error("This document is archived and unavailable for viewing.");
    }
    const file = await fileStore.get(doc.fileId);
    if (!file) throw new Error("Preview unavailable. The document file is not stored.");
    const url = URL.createObjectURL(file.blob);
    appendAudit(documentId, purpose === "download" ? "downloaded" : "viewed", user);
    return {
      url,
      mimeType: file.mimeType,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  },

  async listAudit(user: SessionUser, documentId: string): Promise<DocumentAuditEntry[]> {
    await ensureSeeded();
    await delay();
    const doc = findDoc(documentId);
    if (!doc || !canAccessDoc(user, doc)) return [];
    return [...auditStore]
      .filter((e) => e.documentId === documentId)
      .sort((a, b) => b.at.localeCompare(a.at));
  },

  listDocumentTypes(): typeof DOCUMENT_TYPES {
    return DOCUMENT_TYPES;
  },

  listTypesForRole(role: UserRole): typeof DOCUMENT_TYPES {
    return DOCUMENT_TYPES.filter((c) => c.uploaderRoles.includes(role));
  },

  canAccessDoc,
};
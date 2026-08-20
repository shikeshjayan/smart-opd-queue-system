"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAsync } from "@/lib/use-async";
import { medicalRecordsMockApi } from "@/features/medical-records/api/medical-records.mock";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { documentsMockApi } from "../api/documents.mock";
import { useDocumentUpload } from "../hooks/useDocumentUpload";
import { validateUploadForm } from "../utils/validation";
import type { DocumentFormErrors } from "../utils/validation";
import type { DocumentSource, DocumentType, MedicalDocument } from "../types/medical-document.types";
import { DocumentTypeSelect } from "./DocumentTypeSelect";

type DocumentUploadProps = {
  patientId: string;
  amendTarget?: MedicalDocument | null;
  onDone: (document: MedicalDocument | null) => void;
  onCancel: () => void;
};

export function DocumentUpload({ patientId, amendTarget, onDone, onCancel }: DocumentUploadProps) {
  const { user } = useAuth();
  const upload = useDocumentUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allowedTypes = user ? documentsMockApi.listTypesForRole(user.role).map((c) => c.type) : [];
  const encounters = useAsync(
    () => medicalRecordsMockApi.listEncounters(patientId, { keyword: "" }, 1, 50),
    [patientId]
  );

  const [file, setFile] = useState<{ name: string; type: string; size: number; blob: Blob } | null>(null);
  const [type, setType] = useState<DocumentType | "">(amendTarget?.type ?? "");
  const [title, setTitle] = useState(amendTarget?.title ?? "");
  const [date, setDate] = useState(amendTarget?.documentDate ?? "");
  const [encounter, setEncounter] = useState(amendTarget?.encounterId ?? "");
  const [errors, setErrors] = useState<DocumentFormErrors>({});

  const isAmend = !!amendTarget;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }
    setFile({
      name: selected.name,
      type: selected.type,
      size: selected.size,
      blob: selected,
    });
    if (!title) setTitle(selected.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = async () => {
    if (!user) return;
    const formErrors = validateUploadForm({
      file: isAmend ? { name: file?.name ?? "", type: file?.type ?? "", size: file?.size ?? 0, blob: file?.blob ?? new Blob() } : file,
      type,
      title,
      documentDate: date,
    });
    if (isAmend && !file && formErrors.file) {
      delete formErrors.file;
    }
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    if (isAmend && amendTarget) {
      const result = await (file
        ? documentsMockApi.amendDocument(user, amendTarget.id, {
            title,
            documentDate: date,
            file,
          })
        : documentsMockApi.amendDocument(user, amendTarget.id, {
            title,
            documentDate: date,
          }));
      if (result) onDone(result);
      return;
    }

    if (!file) {
      setErrors({ file: "Please select a file." });
      return;
    }

    const source: DocumentSource = user.role === "patient" ? "patient_provided" : "system";
    const input = {
      patientId,
      type: type as DocumentType,
      title,
      documentDate: date,
      encounterId: encounter || undefined,
      source,
      file,
    };
    const result = await upload.upload(input);
    if (result) onDone(result);
  };

  return (
    <Dialog
      open
      onClose={onCancel}
      title={isAmend ? "Amend Document" : "Upload Medical Document"}
      className="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        {isAmend && (
          <p className="rounded-card border border-status-info-soft bg-status-info-soft px-3 py-2 text-xs text-status-info">
            Amending “{amendTarget?.title}” creates a new version. The original is never overwritten.
          </p>
        )}

        <div>
          <label htmlFor="doc-file" className="mb-1 block text-sm font-medium text-ink-700">
            File {isAmend ? "(optional — leave empty to keep current file)" : ""}
          </label>
          <input
            ref={fileInputRef}
            id="doc-file"
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp,.docx,.xlsx,.txt"
            onChange={handleFileChange}
            className="block w-full text-sm text-ink-700 file:mr-3 file:rounded-btn file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
          <p className="mt-1 text-xs text-ink-400">Up to 10 MB · PDF, PNG, JPEG, WEBP, DOCX, XLSX, TXT</p>
          {file && (
            <p className="mt-1 text-xs text-ink-600">
              {file.name} · {Math.ceil(file.size / 1024)} KB
            </p>
          )}
          {errors.file && <p className="mt-1 text-xs text-status-danger">{errors.file}</p>}
        </div>

        <DocumentTypeSelect
          value={type}
          onChange={setType}
          allowedTypes={allowedTypes}
          disabled={isAmend}
          error={errors.type}
        />

        <div>
          <label htmlFor="doc-title" className="mb-1 block text-sm font-medium text-ink-700">
            Title
          </label>
          <Input
            id="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. CBC Report"
            maxLength={200}
            aria-invalid={!!errors.title}
          />
          {errors.title && <p className="mt-1 text-xs text-status-danger">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="doc-date" className="mb-1 block text-sm font-medium text-ink-700">
            Date
          </label>
          <Input
            id="doc-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.documentDate && <p className="mt-1 text-xs text-status-danger">{errors.documentDate}</p>}
        </div>

        <div>
          <label htmlFor="doc-encounter" className="mb-1 block text-sm font-medium text-ink-700">
            Link to encounter (optional)
          </label>
          <Select
            id="doc-encounter"
            value={encounter}
            onChange={(e) => setEncounter(e.target.value)}
            disabled={encounters.isLoading}
          >
            <option value="">No encounter link</option>
            {encounters.data?.items.map((enc) => (
              <option key={enc.id} value={enc.id}>
                {enc.date} · {enc.departmentName} · {enc.doctorName}
              </option>
            ))}
          </Select>
        </div>

        {user?.role === "patient" && !isAmend && (
          <p className="text-xs text-ink-500">
            Documents you upload are marked as patient-provided and shared with your treating hospital.
          </p>
        )}

        {upload.error && (
          <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft px-3 py-2 text-sm text-status-danger">
            {upload.error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={upload.uploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={upload.uploading || !user}>
            {upload.uploading ? "Uploading…" : isAmend ? "Create Amendment" : "Upload"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
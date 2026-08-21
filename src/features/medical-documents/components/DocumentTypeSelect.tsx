"use client";

import { useId } from "react";
import { Select } from "@/components/ui/select";
import { DOCUMENT_TYPES } from "../types/medical-document.types";
import type { DocumentCategory, DocumentType } from "../types/medical-document.types";

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  lab: "Laboratory",
  imaging: "Imaging",
  prescription: "Prescription",
  other: "Other",
};

type DocumentTypeSelectProps = {
  value: DocumentType | "";
  onChange: (type: DocumentType) => void;
  allowedTypes?: readonly (typeof DOCUMENT_TYPES)[number]["type"][];
  error?: string;
  disabled?: boolean;
  label?: string;
};

export function DocumentTypeSelect({
  value,
  onChange,
  allowedTypes,
  error,
  disabled,
  label = "Document type",
}: DocumentTypeSelectProps) {
  const id = useId();
  const visible = DOCUMENT_TYPES.filter(
    (c) => !allowedTypes || allowedTypes.includes(c.type)
  );
  const categories: DocumentCategory[] = ["lab", "imaging", "prescription", "other"];

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink-700">
        {label}
      </label>
      <Select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as DocumentType)}
        aria-invalid={!!error}
      >
        <option value="">Select a type…</option>
        {categories.map((category) => {
          const options = visible.filter((c) => c.category === category);
          if (options.length === 0) return null;
          return (
            <optgroup key={category} label={CATEGORY_LABEL[category]}>
              {options.map((config) => (
                <option key={config.type} value={config.type}>
                  {config.label}
                </option>
              ))}
            </optgroup>
          );
        })}
      </Select>
      {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
    </div>
  );
}
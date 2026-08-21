"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DOCUMENT_TYPES } from "../types/medical-document.types";
import type {
  DocumentCategory,
  DocumentFilters,
  DocumentSort,
  DocumentType,
} from "../types/medical-document.types";

const CATEGORY_PILLS: { value: DocumentCategory | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "lab", label: "Lab" },
  { value: "imaging", label: "Imaging" },
  { value: "prescription", label: "Prescription" },
  { value: "other", label: "Other" },
];

type DocumentFiltersProps = {
  filters: DocumentFilters;
  onChange: (filters: DocumentFilters) => void;
  sort: DocumentSort;
  onSortChange: (sort: DocumentSort) => void;
  hospitals: { id: string; name: string }[];
  encounters: { id: string; label: string }[];
  years: string[];
  allowStatus?: boolean;
};

export function DocumentFilters({
  filters,
  onChange,
  sort,
  onSortChange,
  hospitals,
  encounters,
  years,
  allowStatus,
}: DocumentFiltersProps) {
  const update = (patch: Partial<DocumentFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          type="search"
          placeholder="Search documents…"
          value={filters.keyword}
          onChange={(e) => update({ keyword: e.target.value })}
          className="sm:max-w-xs"
          aria-label="Search documents"
        />
        <div className="flex items-center gap-1 overflow-x-auto" role="tablist" aria-label="Document category filter">
          {CATEGORY_PILLS.map((pill) => {
            const active = filters.category === pill.value;
            return (
              <button
                key={pill.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => update({ category: pill.value || undefined })}
                className={`whitespace-nowrap rounded-btn px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-600 text-white"
                    : "bg-surface text-ink-600 hover:bg-ink-100"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={filters.type ?? ""}
          onChange={(e) => update({ type: (e.target.value || undefined) as DocumentType | undefined })}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          {DOCUMENT_TYPES.map((config) => (
            <option key={config.type} value={config.type}>
              {config.label}
            </option>
          ))}
        </Select>
        <Select
          value={filters.hospitalId ?? ""}
          onChange={(e) => update({ hospitalId: e.target.value || undefined })}
          aria-label="Filter by hospital"
        >
          <option value="">All hospitals</option>
          {hospitals.map((hospital) => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.name}
            </option>
          ))}
        </Select>
        <Select
          value={filters.encounterId ?? ""}
          onChange={(e) => update({ encounterId: e.target.value || undefined })}
          aria-label="Filter by encounter"
        >
          <option value="">All encounters</option>
          {encounters.map((encounter) => (
            <option key={encounter.id} value={encounter.id}>
              {encounter.label}
            </option>
          ))}
        </Select>
        <Select
          value={filters.year ?? ""}
          onChange={(e) => update({ year: e.target.value || undefined })}
          aria-label="Filter by year"
        >
          <option value="">All years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {allowStatus && (
            <Select
              value={filters.status ?? "active"}
              onChange={(e) =>
                update({ status: (e.target.value || undefined) as DocumentFilters["status"] })
              }
              aria-label="Document status"
              className="h-9 w-40"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Sort order">
          <span className="mr-1 text-xs text-ink-500">Sort:</span>
          {(["newest", "oldest"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onSortChange(value)}
              className={`rounded-btn px-3 py-1 text-sm font-medium transition-colors ${
                sort === value ? "bg-brand-600 text-white" : "bg-surface text-ink-600 hover:bg-ink-100"
              }`}
            >
              {value === "newest" ? "Newest" : "Oldest"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
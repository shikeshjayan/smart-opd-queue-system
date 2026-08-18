"use client";

import { formatDate } from "@/features/medical-records/utils/format";
import type { PatientSearchResult } from "../types/registration.types";

type ExistingPatientCardProps = {
  patient: PatientSearchResult;
  onClear: () => void;
};

export function ExistingPatientCard({ patient, onClear }: ExistingPatientCardProps) {
  return (
    <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink-900">{patient.name}</p>
          <p className="font-mono text-xs text-ink-500">{patient.id}</p>
          <p className="mt-1 text-sm text-ink-700">
            {patient.age} yrs &middot; {patient.gender} &middot; {patient.phone}
          </p>
          <p className="mt-0.5 text-sm text-ink-500">
            Last visit: {patient.lastVisit ? formatDate(patient.lastVisit) : "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
        >
          Change Patient
        </button>
      </div>
    </div>
  );
}
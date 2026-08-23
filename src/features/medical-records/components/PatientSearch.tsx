"use client";

import Link from "next/link";
import { usePatientSearch } from "../hooks/usePatientSearch";
import { Skeleton } from "@/components/ui/skeleton";
import { maskPatientName } from "@/lib/privacy";

type PatientSearchProps = {
  hospitalId?: string;
  resultHref?: (patientId: string) => string;
};

export function PatientSearch({ hospitalId, resultHref }: PatientSearchProps) {
  const { results, isLoading, query, search, clear } = usePatientSearch();

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-ink-500">
        Search Patient
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Patient number, name, or phone"
            value={query}
            onChange={(e) => void search(e.target.value, hospitalId)}
            className="h-10 flex-1 rounded-btn border border-ink-300 bg-surface px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-2 focus:outline-brand-600"
          />
          {query && (
            <button
              type="button"
              onClick={clear}
              className="rounded-btn border border-ink-300 px-3 py-2 text-sm text-ink-600 hover:bg-ink-100"
            >
              Clear
            </button>
          )}
        </div>
      </label>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && query && results.length === 0 && (
        <p className="rounded-card border border-ink-200 bg-surface p-4 text-center text-sm text-ink-400 shadow-card">
          No patients found matching &ldquo;{query}&rdquo;
        </p>
      )}

      {!isLoading && results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((patient) => (
            <li key={patient.patientId}>
              <Link
                href={resultHref ? resultHref(patient.patientId) : `/hospital/patient-search/${patient.patientId}`}
                className="flex items-center justify-between rounded-card border border-ink-200 bg-surface p-4 shadow-card transition-colors hover:border-brand-300 hover:bg-brand-50/30"
              >
                <div>
                  <p className="text-sm font-medium text-ink-900">{patient.patientId}</p>
                  <p className="text-xs text-ink-400">Patient record</p>
                </div>
                <span className="text-xs text-brand-600">View →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

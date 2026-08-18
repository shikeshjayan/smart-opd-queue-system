"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/features/medical-records/utils/format";
import { usePatientSearch } from "../hooks/useRegistration";
import type { PatientSearchResult } from "../types/registration.types";

type PatientSearchProps = {
  onSelect: (patient: PatientSearchResult) => void;
  onRegisterNew?: () => void;
  autoFocus?: boolean;
};

export function PatientSearch({ onSelect, onRegisterNew, autoFocus }: PatientSearchProps) {
  const [query, setQuery] = useState("");
  const { data, isLoading, error } = usePatientSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function handleEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && data && data.length > 0) {
      event.preventDefault();
      onSelect(data[0]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-700">
          Search by Patient ID / Mobile / Name
        </span>
        <Input
          ref={inputRef}
          type="search"
          placeholder="e.g. P10294, +91 98470 12345 or Rahul"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleEnter}
          aria-label="Search patient"
        />
      </label>
      <p className="text-xs text-ink-400">Press Enter to select the first match.</p>

      {query.trim() === "" ? null : isLoading ? (
        <p className="text-sm text-ink-500">Searching...</p>
      ) : error ? (
        <p role="alert" className="text-sm text-status-danger">
          {error}
        </p>
      ) : data && data.length > 0 ? (
        <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Patient ID</th>
                <th scope="col" className="px-4 py-2 font-medium">Name</th>
                <th scope="col" className="px-4 py-2 font-medium">Age</th>
                <th scope="col" className="px-4 py-2 font-medium">Last Visit</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {data.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-4 py-2 font-mono text-xs text-ink-700">{patient.id}</td>
                  <td className="px-4 py-2 font-medium text-ink-900">{patient.name}</td>
                  <td className="px-4 py-2 text-ink-700">{patient.age}</td>
                  <td className="px-4 py-2 text-ink-500">
                    {patient.lastVisit ? formatDate(patient.lastVisit) : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(patient)}
                      className="rounded-btn border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-ink-300 p-6 text-center">
          <p className="text-sm text-ink-500">No matching patient found.</p>
          {onRegisterNew && (
            <button
              type="button"
              onClick={onRegisterNew}
              className="mt-3 rounded-btn bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Register New Patient
            </button>
          )}
        </div>
      )}
    </div>
  );
}
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import type { PatientSearchResult } from "@/features/registration/types/registration.types";
import { registrationService } from "@/services/registration";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { inputCls } from "@/features/consultation/utils/classes";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewReceptionAppointmentPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PatientSearchResult | null>(null);
  const search = useAsync(() => registrationService.searchPatients(query), [query]);

  if (selected) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">New Appointment</h1>
            <p className="mt-1 text-sm text-ink-500">
              Patient: <span className="font-medium">{selected.name}</span> ({selected.id})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
            >
              Change patient
            </button>
            <Link
              href="/reception/appointments"
              className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
            >
              Back
            </Link>
          </div>
        </div>
        <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
          <AppointmentForm
            patientId={selected.id}
            onBooked={() => router.push("/reception/appointments")}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">New Appointment</h1>
        <p className="mt-1 text-sm text-ink-500">Find the patient to book an appointment for.</p>
      </div>

      <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Search patient</span>
          <input
            className={inputCls}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient ID, name or mobile number"
            autoFocus
          />
        </label>

        <div className="mt-4">
          {query.trim().length === 0 ? (
            <p className="text-sm text-ink-500">Start typing to find a registered patient.</p>
          ) : search.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : search.data && search.data.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {search.data.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(patient)}
                    className="flex w-full flex-col gap-0.5 rounded-btn border border-ink-200 px-4 py-3 text-left transition-colors hover:border-brand-600"
                  >
                    <span className="text-sm font-medium text-ink-900">{patient.name}</span>
                    <span className="text-xs text-ink-500">
                      {patient.id} · {patient.age} yrs · {patient.phone}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">No matching patients. Check the registration desk.</p>
          )}
        </div>
      </section>
    </div>
  );
}
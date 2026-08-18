"use client";

import { useMemo, useState } from "react";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { ConnectionStatus } from "@/features/queue/components/ConnectionStatus";
import { QueueList } from "@/features/queue/components/QueueList";
import { QueueStatusBadge } from "@/features/queue/components/QueueStatusBadge";
import { useDoctorQueueRealtime } from "@/features/queue/hooks/useQueueRealtime";
import { useOpdAvailability } from "@/features/registration/hooks/useRegistration";
import { useReception } from "@/features/registration/reception-context";

export default function ReceptionQueuePage() {
  const { hospitalId, hospital } = useReception();
  const opds = useOpdAvailability(hospitalId);
  const [opdId, setOpdId] = useState<string>("");

  const options = useMemo(
    () => (opds.data ?? []).filter((opd) => opd.availability !== "closed"),
    [opds.data]
  );
  const selectedOpdId = opdId || options[0]?.opdId || "";

  const queue = useDoctorQueueRealtime(selectedOpdId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Live Queue</h1>
          <p className="mt-1 text-sm text-ink-500">{hospital?.name}</p>
        </div>
        <ConnectionStatus status={queue.connection} />
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">OPD</span>
          <Select value={selectedOpdId} onChange={(e) => setOpdId(e.target.value)} aria-label="Select OPD">
            {options.map((opd) => (
              <option key={opd.opdId} value={opd.opdId}>
                {opd.opdName} &middot; {opd.departmentName}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-ink-500">No OPDs available for this hospital.</p>
      ) : queue.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : queue.error ? (
        <ErrorState message={queue.error} onRetry={queue.reload} />
      ) : !queue.data ? (
        <p className="text-sm text-ink-500">No queue available for this OPD.</p>
      ) : (
        <>
          {queue.data.current ? (
            <section
              aria-labelledby="current-token-title"
              className="rounded-card bg-brand-700 p-5 text-white shadow-token"
            >
              <h2 id="current-token-title" className="text-xs font-semibold uppercase tracking-wide text-brand-100">
                Currently Consulting
              </h2>
              <p className="mt-3 text-4xl font-bold tracking-tight">{queue.data.current.tokenNumber}</p>
              <p className="mt-1 text-sm text-brand-100">
                {queue.data.current.patientName ?? "Patient"}
              </p>
              <div className="mt-3">
                <QueueStatusBadge status={queue.data.current.status} />
              </div>
            </section>
          ) : (
            <section
              aria-labelledby="no-current-title"
              className="rounded-card border border-ink-200 bg-surface p-5 shadow-card"
            >
              <h2 id="no-current-title" className="text-lg font-semibold text-ink-900">
                Currently Consulting
              </h2>
              <p className="mt-2 text-sm text-ink-500">No patient is being consulted right now.</p>
            </section>
          )}

          <section aria-labelledby="waiting-list-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
            <h2 id="waiting-list-title" className="text-lg font-semibold text-ink-900">
              Waiting Patients
            </h2>
            <p className="mt-0.5 text-sm text-ink-500">{queue.data.counts.waiting} waiting</p>
            <div className="mt-4">
              <QueueList entries={queue.data.waiting} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

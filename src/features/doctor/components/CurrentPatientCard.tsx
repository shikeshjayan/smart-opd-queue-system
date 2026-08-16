import Link from "next/link";
import type { PatientSummary, QueueEntry } from "@/types";
import { QueueStatusBadge } from "@/features/queue/components/QueueStatusBadge";

type CurrentPatientCardProps = {
  entry: QueueEntry;
  patient: PatientSummary | null;
  encounterId: string;
};

export function CurrentPatientCard({ entry, patient, encounterId }: CurrentPatientCardProps) {
  return (
    <section aria-labelledby="current-patient-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
      <h2 id="current-patient-title" className="text-lg font-semibold text-ink-900">
        Current Patient
      </h2>
      <p className="mt-2 text-3xl font-bold tabular-nums text-ink-900">{entry.tokenNumber}</p>
      <p className="mt-0.5 text-sm text-ink-500">
        {patient ? `${patient.name} · #${patient.id}` : entry.patientId ? `Patient #${entry.patientId}` : "—"}
      </p>
      <div className="mt-2">
        <QueueStatusBadge status={entry.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={patient ? `/doctor/patients/${patient.id}` : "#"}
          aria-disabled={!patient}
          className={`flex h-10 flex-1 items-center justify-center rounded-btn border border-ink-300 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-brand-600 ${
            patient ? "" : "pointer-events-none opacity-50"
          }`}
        >
          Open Patient
        </Link>
        <Link
          href={encounterId ? `/doctor/consultation/${encounterId}` : "#"}
          aria-disabled={!encounterId}
          className={`flex h-10 flex-1 items-center justify-center rounded-btn bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
            encounterId ? "" : "pointer-events-none opacity-50"
          }`}
        >
          Complete
        </Link>
      </div>
    </section>
  );
}

import Link from "next/link";
import type { Encounter, PatientSummary } from "@/types";
import { EncounterStatusBadge } from "@/features/encounter/components/EncounterStatusBadge";

type PatientHeaderProps = {
  patient: PatientSummary;
  encounter?: Encounter | null;
};

export function PatientHeader({ patient, encounter }: PatientHeaderProps) {
  return (
    <div className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Patient</p>
          <h1 className="mt-0.5 text-2xl font-bold text-ink-900">{patient.name}</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            Patient ID: <span className="font-medium tabular-nums text-ink-700">{patient.id}</span>
            &nbsp;&middot;&nbsp;{patient.age} years &middot;{" "}
            {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
            {patient.bloodGroup ? ` · Blood ${patient.bloodGroup}` : ""}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 text-right">
          {encounter ? (
            <>
              <p className="text-sm text-ink-700">
                Current OPD: <span className="font-medium">{encounter.departmentName}</span>
              </p>
              <p className="text-sm text-ink-700">
                Token: <span className="font-semibold tabular-nums">{encounter.tokenNumber}</span>
              </p>
              <EncounterStatusBadge status={encounter.status} />
            </>
          ) : (
            <p className="text-sm text-ink-500">No active consultation</p>
          )}
        </div>
      </div>

      {patient.phone && (
        <p className="mt-2 text-xs text-ink-500">
          Phone: {patient.phone} &middot; Registered at {patient.registeredHospitalId === "hos_001" ? "Government Hospital Ernakulam" : "government hospital"}
        </p>
      )}

      <div className="mt-3 border-t border-ink-100 pt-3">
        <Link
          href="/doctor/queue"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          Back to Queue
        </Link>
        <span className="mx-2 text-ink-300">&middot;</span>
        <Link
          href={`/doctor/patients/${patient.id}`}
          className="text-sm font-medium text-ink-600 hover:underline"
        >
          Patient Overview
        </Link>
      </div>
    </div>
  );
}
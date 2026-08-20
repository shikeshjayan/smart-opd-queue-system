import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useConsultationContext } from "../hooks/useConsultation";
import { RequestCorrectionDialog } from "./RequestCorrectionDialog";
import { EncounterStatusBadge } from "@/features/encounter/components/EncounterStatusBadge";
import { usePrescriptionHistory } from "@/features/prescription/hooks/usePrescriptions";
import { usePharmacyActions } from "@/features/pharmacy/hooks/usePharmacyQueue";
import { printPrescription } from "@/features/prescription/utils/print";
import { patientNameFor } from "@/services/prescription";
import { formatDate } from "@/features/medical-records/utils/format";

type CompletedRecordViewProps = {
  encounterId: string;
  patientId: string;
};

export function CompletedRecordView({ encounterId, patientId }: CompletedRecordViewProps) {
  const { data, isLoading, error } = useConsultationContext(encounterId);
  const { data: prescriptions } = usePrescriptionHistory(patientId);
  const { run, running, error: actionError } = usePharmacyActions();
  const [correctionOpen, setCorrectionOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load completed record."} />;
  }

  const { encounter } = data;
  const prescription = prescriptions?.find((p) => p.encounterId === encounterId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <div>
          <p className="text-sm font-medium text-ink-900">Encounter #{encounter.id}</p>
          <p className="text-xs text-ink-500">
            {encounter.departmentName} · {encounter.hospitalName} ·{" "}
            {encounter.startedAt ? formatDate(encounter.startedAt.slice(0, 10)) : encounter.date}
          </p>
        </div>
        <EncounterStatusBadge status={encounter.status} />
      </div>

      {data.record.diagnoses.length > 0 && (
        <section className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Diagnosis</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {data.record.diagnoses.map((diagnosis, index) => (
              <li key={`${diagnosis.code ?? diagnosis.name}-${index}`}>
                <Badge variant={diagnosis.type === "primary" ? "info" : "default"}>
                  {diagnosis.name}
                  {diagnosis.code ? ` (${diagnosis.code})` : ""}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.record.treatmentPlan && (
        <section className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Treatment</h3>
          <p className="mt-2 text-sm text-ink-900">{data.record.treatmentPlan}</p>
        </section>
      )}

      {data.record.followUp.decision !== "none" && (
        <section className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Follow-up</h3>
          <p className="mt-2 text-sm text-ink-900">
            {data.record.followUp.decision === "return" && "Return visit"}
            {data.record.followUp.decision === "review" && "Scheduled review"}
            {data.record.followUp.decision === "refer" && "Referral"}
            {data.record.followUp.date ? ` · ${formatDate(data.record.followUp.date)}` : ""}
          </p>
          {data.record.followUp.notes && (
            <p className="mt-1 text-sm text-ink-600">{data.record.followUp.notes}</p>
          )}
        </section>
      )}

      {actionError && (
        <p className="rounded-card border border-status-danger-soft bg-status-danger-soft p-3 text-sm text-status-danger">
          {actionError}
        </p>
      )}

      {prescription && (
        <section className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Prescription #{prescription.id}</h3>
              <p className="mt-1 text-xs text-ink-500">
                {prescription.medicines.length} item{prescription.medicines.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => printPrescription(prescription, patientNameFor(patientId), patientId)}
              >
                Print
              </Button>
              {prescription.status === "prescribed" && (
                <Button
                  size="sm"
                  disabled={running === prescription.id}
                  onClick={async () => {
                    const ok = await run("dispatch", prescription.id);
                    if (ok) window.location.reload();
                  }}
                >
                  {running === prescription.id ? "Sending..." : "Send to pharmacy"}
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/doctor/patients/${patientId}/encounters/${encounterId}`}
          className="inline-flex h-11 items-center rounded-btn bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          View Record
        </Link>
        <Button variant="outline" onClick={() => setCorrectionOpen(true)}>
          Request Correction
        </Button>
      </div>

      <RequestCorrectionDialog
        open={correctionOpen}
        encounterId={encounterId}
        onClose={() => setCorrectionOpen(false)}
      />
    </div>
  );
}
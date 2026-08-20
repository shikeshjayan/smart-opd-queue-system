import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePrescriptionHistory } from "@/features/prescription/hooks/usePrescriptions";
import { usePharmacyActions } from "@/features/pharmacy/hooks/usePharmacyQueue";
import { printPrescription } from "@/features/prescription/utils/print";
import { patientNameFor } from "@/services/prescription";
import type { Encounter, PatientSummary } from "@/types";

type ConsultationCompleteScreenProps = {
  encounter: Encounter;
  patient: PatientSummary | null;
};

export function ConsultationCompleteScreen({ encounter, patient }: ConsultationCompleteScreenProps) {
  const { data: prescriptions } = usePrescriptionHistory(encounter.patientId);
  const { run, running, error: actionError } = usePharmacyActions();
  const prescription = prescriptions?.find((p) => p.encounterId === encounter.id);

  return (
    <div className="mx-auto max-w-xl">
      <section className="rounded-card border border-ink-200 bg-surface p-6 text-center shadow-card" aria-labelledby="complete-title">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-success-soft text-2xl text-status-success" aria-hidden="true">
          ✓
        </span>
        <h1 id="complete-title" className="mt-3 text-2xl font-bold text-ink-900">
          Consultation completed
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {patient ? `${patient.name} · ${patient.id}` : encounter.patientId}
        </p>
        <p className="mt-4 text-sm text-ink-500">
          Encounter ID
        </p>
        <p className="text-lg font-semibold tabular-nums text-brand-700">{encounter.id}</p>

        {prescription && (
          <div className="mt-5 rounded-card border border-ink-200 bg-ink-50 p-4 text-left">
            <p className="text-sm font-medium text-ink-900">
              Prescription #{prescription.id}
              <span className="ml-2 text-xs font-normal text-ink-500">
                {prescription.status === "prescribed" && "Ready to send to pharmacy"}
                {prescription.status === "sent_to_pharmacy" && "Sent to pharmacy"}
                {prescription.status === "dispensed" && "Dispensed"}
              </span>
            </p>
            {actionError && <p className="mt-2 text-sm text-status-danger">{actionError}</p>}
            {prescription.status === "prescribed" && (
              <div className="mt-3 flex gap-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => printPrescription(prescription, patientNameFor(encounter.patientId), encounter.patientId)}
                >
                  Print
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={`/doctor/patients/${encounter.patientId}/encounters/${encounter.id}`}
            className="flex h-12 items-center justify-center rounded-btn border border-brand-600 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            View Summary
          </Link>
          <Link
            href="/doctor/queue"
            className="flex h-12 items-center justify-center rounded-btn bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Next Patient
          </Link>
        </div>
      </section>
    </div>
  );
}
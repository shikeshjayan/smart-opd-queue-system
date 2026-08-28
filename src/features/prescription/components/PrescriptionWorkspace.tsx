"use client";

import { useMemo, useState } from "react";
import { useAsync } from "@/lib/use-async";
import { consultationMockApi } from "@/features/consultation/api/consultation.mock";
import { listEncounters } from "@/services/data";
import type { Encounter } from "@/types";
import type { Prescription } from "@/services/prescription/types";
import { useDoctorPatient } from "@/features/medical-records/hooks/useMedicalRecords";
import { useActiveMedications } from "../hooks/usePrescriptions";
import { usePrescriptionWorkflow } from "../hooks/usePrescription";
import { prescriptionMockApi } from "../api/prescription.mock";
import { validatePrescription } from "../utils/prescription-validation";
import { PatientHeader } from "@/features/consultation/components/PatientHeader";
import { PrescriptionForm } from "./PrescriptionForm";
import { PrescriptionReview } from "./PrescriptionReview";
import { PrescribedMedicineView } from "./PrescribedMedicineView";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { printPrescription } from "../utils/print";
import { patientNameFor } from "@/services/prescription";
import { usePermissions } from "@/features/auth/hooks/useAuth";
import { AllergyWarning } from "@/features/medication/components/AllergyWarning";

const EMPTY_REF = {
  patientId: "",
  doctorId: "",
  hospitalId: "",
  doctorName: "",
  hospitalName: "",
  departmentName: "",
};

async function resolveEncounter(patientId: string): Promise<Encounter | null> {
  const active = await consultationMockApi.getOrCreateForPatient(patientId);
  if (active?.encounter) return active.encounter;
  const history = listEncounters(patientId).filter((e) => e.status !== "cancelled");
  history.sort((a, b) => b.date.localeCompare(a.date));
  return history[0] ?? null;
}

type Step = "form" | "review" | "finalized";

export function PrescriptionWorkspace({ patientId }: { patientId: string }) {
  const encounterState = useAsync(() => resolveEncounter(patientId), [patientId]);
  const patientView = useDoctorPatient(patientId);
  const activeMeds = useActiveMedications(patientId);
  const [step, setStep] = useState<Step>("form");
  const [finalizedRx, setFinalizedRx] = useState<Prescription | null>(null);

  const encounter = encounterState.data ?? null;
  const contextRef = useMemo(
    () =>
      encounter
        ? {
            patientId: encounter.patientId,
            doctorId: encounter.doctorId ?? "",
            hospitalId: encounter.hospitalId,
            doctorName: encounter.doctorName ?? "",
            hospitalName: encounter.hospitalName ?? "",
            departmentName: encounter.departmentName ?? "",
          }
        : EMPTY_REF,
    [encounter]
  );

  const existingRx = useAsync(
    () =>
      encounter
        ? prescriptionMockApi.listForEncounter(encounter.id)
        : Promise.resolve([] as Prescription[]),
    [encounter?.id]
  );

  const { can } = usePermissions();
  const canPrescribe = can("PRESCRIBE_MEDICATION");
  const canRequestCorrection = can("REQUEST_CORRECTION");

  const workflow = usePrescriptionWorkflow({
    encounterId: encounter?.id ?? "",
    contextRef,
    onFinalized: (prescription) => {
      setFinalizedRx(prescription);
      setStep("finalized");
    },
    onCorrected: () => setStep("form"),
  });

  const validation = validatePrescription(workflow.items);

  const handleReview = () => {
    if (validation.valid) setStep("review");
  };

  const allergies = patientView.data?.summary.allergies.map((allergy) => allergy.substance) ?? [];
  const allergySummary = patientView.data?.summary.allergies ?? [];
  const patientName = patientView.data?.patient.name ?? patientNameFor(patientId);

  if (encounterState.isLoading || patientView.isLoading || activeMeds.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (encounterState.error || !encounter || patientView.error || !patientView.data) {
    return (
      <div className="flex flex-col gap-4">
        {(encounterState.error || patientView.error) && (
          <ErrorState
            message={encounterState.error ?? patientView.error ?? "Unable to load patient."}
            onRetry={patientView.error ? patientView.reload : encounterState.reload}
          />
        )}
        <div>
          <EmptyState
            title="No encounter for prescription"
            description="A prescription is linked to a consultation encounter. Start a consultation for this patient first."
            action={
              <a
                href={`/doctor/patients/${patientId}/consultation`}
                className="rounded-btn bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                Go to Consultation
              </a>
            }
          />
        </div>
      </div>
    );
  }

  const existingFinalized =
    existingRx.data?.find((p) => p.workflowStatus === "finalized") ?? null;
  const showExistingReadonly =
    step === "form" && !workflow.loading && !workflow.draft && existingFinalized && !finalizedRx;

  return (
    <div className="flex flex-col gap-6">
      <PatientHeader patient={patientView.data.patient} encounter={encounter} />

      {!showExistingReadonly && step !== "finalized" && (
        <AllergyWarning allergies={allergySummary} />
      )}

      {!canPrescribe && !showExistingReadonly ? (
        <EmptyState
          title="Prescription permissions"
          description="You don't have permission to create prescriptions. Access is enforced by backend authorization."
        />
      ) : workflow.loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : showExistingReadonly ? (
        <ExistingFinalizedView
          prescription={existingFinalized}
          patientName={patientName}
          patientId={patientId}
          onRequestCorrection={
            canRequestCorrection
              ? () => void workflow.requestCorrection(existingFinalized)
              : undefined
          }
        />
      ) : step === "finalized" && finalizedRx ? (
        <div className="mx-auto w-full max-w-2xl">
          <section
            aria-labelledby="finalized-title"
            className="rounded-card border border-ink-200 bg-surface p-6 text-center shadow-card"
          >
            <span
              aria-hidden="true"
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-success-soft text-2xl text-status-success"
            >
              ✓
            </span>
            <h1 id="finalized-title" className="mt-3 text-2xl font-bold text-ink-900">
              Prescription finalized
            </h1>
            <p className="mt-1 text-sm text-ink-500">{patientName}</p>
            <p className="mt-4 text-sm text-ink-500">Prescription ID</p>
            <p className="text-lg font-semibold tabular-nums text-brand-700">
              {finalizedRx.id}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("form");
                  setFinalizedRx(null);
                }}
              >
                View
              </Button>
              <Button
                variant="outline"
                onClick={() => printPrescription(finalizedRx, patientName, patientId)}
              >
                Print
              </Button>
            </div>
          </section>
          <div className="mt-4">
            <PrescribedMedicineView prescription={finalizedRx} />
          </div>
        </div>
      ) : step === "review" ? (
        <PrescriptionReview
          patientName={patientName}
          encounterId={encounter.id}
          doctorName={encounter.doctorName ?? ""}
          hospitalName={encounter.hospitalName ?? ""}
          departmentName={encounter.departmentName ?? ""}
          items={workflow.items}
          instructions={workflow.instructions}
          allergies={allergies}
          existingMedications={activeMeds.data ?? []}
          finalizing={workflow.finalizing}
          actionError={workflow.actionError}
          onBack={() => setStep("form")}
          onFinalize={() => void workflow.finalize()}
        />
      ) : (
        <PrescriptionForm
          items={workflow.items}
          onChange={workflow.updateItems}
          instructions={workflow.instructions}
          onInstructionsChange={workflow.updateInstructions}
          allergies={allergies}
          existingMedications={activeMeds.data ?? []}
          saving={workflow.saving}
          savedAt={workflow.savedAt}
          actionError={workflow.actionError}
          itemErrors={validation.itemErrors}
          onReview={handleReview}
          onSaveNow={() => void workflow.flush()}
        />
      )}
    </div>
  );
}

type ExistingFinalizedViewProps = {
  prescription: Prescription;
  patientName: string;
  patientId: string;
  onRequestCorrection?: () => void;
};

function ExistingFinalizedView({
  prescription,
  patientName,
  patientId,
  onRequestCorrection,
}: ExistingFinalizedViewProps) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Prescription</h1>
          <p className="mt-1 text-sm text-ink-500">
            {patientName} · {prescription.id}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => printPrescription(prescription, patientName, patientId)}
          >
            Print
          </Button>
          {onRequestCorrection && (
            <Button variant="outline" onClick={onRequestCorrection}>
              Request Correction
            </Button>
          )}
        </div>
      </div>
      <p className="rounded-card border border-status-info-soft bg-status-info-soft px-4 py-3 text-sm text-status-info">
        This prescription is finalized and no longer editable. Use Request Correction to raise an
        amendment instead of editing directly.
      </p>
      <PrescribedMedicineView prescription={prescription} />
    </>
  );
}
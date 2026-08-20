import { useMemo } from "react";
import type { MedicationRegimenEntry, PrescriptionDraftItem } from "@/services/prescription/types";
import { formatDuration } from "@/services/prescription/types";
import { medicineById } from "@/services/medicine";
import { MedicationSafetyWarnings } from "@/features/medicine/components/MedicationSafetyWarnings";
import { dailyDoseMg } from "@/features/medicine/utils/dosage";
import { Button } from "@/components/ui/button";
import { existingMedicationWarnings } from "../utils/existing-medication";
import { validatePrescription } from "../utils/prescription-validation";

type PrescriptionReviewProps = {
  patientName: string;
  encounterId: string;
  doctorName: string;
  hospitalName: string;
  departmentName: string;
  items: PrescriptionDraftItem[];
  instructions: string;
  allergies: string[];
  existingMedications: MedicationRegimenEntry[];
  finalizing: boolean;
  actionError: string | null;
  onBack: () => void;
  onFinalize: () => void;
};

export function PrescriptionReview({
  patientName,
  encounterId,
  doctorName,
  hospitalName,
  departmentName,
  items,
  instructions,
  allergies,
  existingMedications,
  finalizing,
  actionError,
  onBack,
  onFinalize,
}: PrescriptionReviewProps) {
  const existingWarnings = useMemo(
    () => Object.values(existingMedicationWarnings(existingMedications, items)),
    [existingMedications, items]
  );
  const doses = items.map((item) => ({
    medicineId: item.medicineId,
    dosage: item.dosage,
    frequency: item.frequency,
    dailyDoseMg: dailyDoseMg(item.dosage, item.frequency),
  }));
  const validation = validatePrescription(items);

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="review-header" className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <h2 id="review-header" className="text-sm font-semibold text-ink-900">
          Review Prescription
        </h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-2">
            <dt className="text-ink-500">Patient</dt>
            <dd className="font-medium text-ink-900">{patientName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-ink-500">Encounter</dt>
            <dd className="font-medium text-ink-900 tabular-nums">{encounterId}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-ink-500">Doctor</dt>
            <dd className="font-medium text-ink-900">{doctorName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-ink-500">Hospital</dt>
            <dd className="text-right font-medium text-ink-900">
              {hospitalName} · {departmentName}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="review-items" className="flex flex-col gap-3">
        <h3 id="review-items" className="text-lg font-semibold text-ink-900">
          Medicines
        </h3>
        <ol className="flex flex-col gap-3">
          {items.map((item, index) => {
            const medicine = medicineById(item.medicineId);
            return (
              <li key={item.medicineId} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
                <p className="text-sm font-semibold text-ink-900">
                  {index + 1}. {item.medicineName}
                </p>
                <p className="text-xs text-ink-500">
                  {medicine?.form}
                  {item.brandLabel ? ` · ${item.brandLabel}` : ""}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-500">Dosage</dt>
                    <dd className="font-medium text-ink-900">{item.dosage}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-500">Frequency</dt>
                    <dd className="font-medium text-ink-900">{item.frequency}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-500">Route</dt>
                    <dd className="font-medium text-ink-900">{item.route}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-500">Duration</dt>
                    <dd className="font-medium text-ink-900">{formatDuration(item.duration)}</dd>
                  </div>
                </dl>
                {item.instructions?.trim() && (
                  <p className="mt-2 border-t border-ink-100 pt-2 text-xs text-ink-700">
                    <span className="font-medium text-ink-900">Instructions:</span>{" "}
                    {item.instructions}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {existingWarnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {existingWarnings.map((warning) => (
            <p key={warning} className="rounded-card border border-status-warning-soft bg-status-warning-soft px-3 py-2 text-sm text-status-warning">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wide">Existing medication:</span>
              {warning}
            </p>
          ))}
        </div>
      )}

      <MedicationSafetyWarnings allergies={allergies} doses={doses} />

      {instructions.trim() && (
        <p className="rounded-card border border-ink-200 bg-surface px-4 py-3 text-sm text-ink-700 shadow-card">
          <span className="font-medium text-ink-900">Instructions:</span> {instructions}
        </p>
      )}

      {actionError && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-3 text-sm text-status-danger">
          {actionError}
        </p>
      )}
      {!validation.valid && validation.prescriptionError && (
        <p className="rounded-card border border-status-danger-soft bg-status-danger-soft p-3 text-sm text-status-danger">
          {validation.prescriptionError}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-ink-200 pt-4 sm:flex-row">
        <Button variant="outline" size="lg" className="flex-1" disabled={finalizing} onClick={onBack}>
          Back to Edit
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={finalizing || !validation.valid}
          onClick={onFinalize}
        >
          {finalizing ? "Finalizing..." : "Finalize Prescription"}
        </Button>
      </div>
    </div>
  );
}
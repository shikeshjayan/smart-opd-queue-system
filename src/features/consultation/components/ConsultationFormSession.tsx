"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/features/auth/hooks/useAuth";
import type { Encounter } from "@/types";
import type { ConsultationContext, ConsultationRecord } from "@/services/consultation/types";
import type { PrescriptionDraftItem } from "@/services/prescription/types";
import { ChiefComplaint } from "./ChiefComplaint";
import { Symptoms } from "./Symptoms";
import { VitalSignsForm } from "./VitalSignsForm";
import { Examination } from "./Examination";
import { DiagnosisForm } from "./DiagnosisForm";
import { Treatment } from "./Treatment";
import { FollowUp } from "./FollowUp";
import { AutoSaveStatus } from "./AutoSaveStatus";
import { CompleteConsultationDialog } from "./CompleteConsultationDialog";
import { useConsultationDraft } from "../hooks/useConsultationDraft";
import { useConsultationComplete } from "../hooks/useConsultationComplete";

type ConsultationFormSessionProps = {
  encounter: Encounter;
  record: ConsultationRecord;
  allergies: string[];
  onCompleted: (context: ConsultationContext | null) => void;
};

export function ConsultationFormSession({
  encounter,
  record,
  allergies,
  onCompleted,
}: ConsultationFormSessionProps) {
  const { can } = usePermissions();
  const draft = useConsultationDraft(encounter.id, record);
  const { complete, isCompleting, error: completeError } = useConsultationComplete();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionDraftItem[]>([]);
  const [prescriptionInstructions, setPrescriptionInstructions] = useState("");

  const checklist = {
    diagnosisEntered: draft.form.diagnoses.length > 0,
    treatmentRecorded: draft.form.treatmentPlan.trim().length > 0,
    requiredFieldsComplete:
      draft.form.chiefComplaint.text.trim().length > 0 &&
      !!draft.form.vitals.bpSystolic &&
      !!draft.form.vitals.pulse,
    followUpRecorded:
      draft.form.followUp.decision !== "none" || Boolean(draft.form.followUp.notes?.trim()),
  };

  const handleComplete = async () => {
    const fresh = await complete(
      encounter.id,
      draft.form,
      prescriptionItems,
      prescriptionInstructions || undefined
    );
    setConfirmOpen(false);
    if (fresh?.encounter) {
      draft.reset();
      onCompleted(fresh);
    }
  };

  return (
    <>
      {completeError && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-4 text-sm text-status-danger">
          {completeError}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-900">Today&apos;s Consultation</p>
        <AutoSaveStatus status={draft.saveStatus} lastSavedAt={draft.lastSavedAt} />
      </div>

      <form
        className="flex flex-col gap-4"
        aria-label="Consultation notes"
        onSubmit={(e) => e.preventDefault()}
      >
        <ChiefComplaint value={draft.form.chiefComplaint} onChange={(v) => draft.update("chiefComplaint", v)} />
        <Symptoms value={draft.form.symptoms} onChange={(v) => draft.update("symptoms", v)} />
        <VitalSignsForm value={draft.form.vitals} onChange={(v) => draft.update("vitals", v)} />
        <Examination value={draft.form.examination} onChange={(v) => draft.update("examination", v)} />
        <DiagnosisForm value={draft.form.diagnoses} onChange={(v) => draft.update("diagnoses", v)} />
        <Treatment
          treatmentPlan={draft.form.treatmentPlan}
          onTreatmentPlanChange={(v) => draft.update("treatmentPlan", v)}
          prescriptionItems={prescriptionItems}
          onPrescriptionItemsChange={setPrescriptionItems}
          prescriptionInstructions={prescriptionInstructions}
          onPrescriptionInstructionsChange={setPrescriptionInstructions}
          allergies={allergies}
        />
        <FollowUp value={draft.form.followUp} onChange={(v) => draft.update("followUp", v)} />
      </form>

      <div className="flex flex-col gap-3 border-t border-ink-200 pt-4 sm:flex-row">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={isCompleting}
          onClick={() => void draft.flush()}
        >
          Save Draft
        </Button>
        {can("COMPLETE_ENCOUNTER") && (
          <Button
            size="lg"
            className="flex-1"
            disabled={isCompleting}
            onClick={() => setConfirmOpen(true)}
          >
            {isCompleting ? "Completing..." : "Complete Consultation"}
          </Button>
        )}
      </div>

      {can("COMPLETE_ENCOUNTER") && (
        <CompleteConsultationDialog
          open={confirmOpen}
          encounter={encounter}
          checklist={checklist}
          isCompleting={isCompleting}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => void handleComplete()}
        />
      )}
    </>
  );
}
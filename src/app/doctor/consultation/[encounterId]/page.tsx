"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/feedback/error-state";
import { SuccessMessage } from "@/components/feedback/success-message";
import { Skeleton } from "@/components/ui/skeleton";
import { useConsultation, useConsultationActions } from "@/features/doctor/hooks/useDoctor";
import { doctorMockApi } from "@/features/doctor/api/doctor.mock";
import { useDoctorPatient } from "@/features/medical-records/hooks/useMedicalRecords";
import { usePermissions } from "@/features/auth/hooks/useAuth";

const textareaClass =
  "min-h-[7rem] w-full rounded-btn border border-ink-300 bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-2 focus:outline-brand-600 disabled:opacity-50";

export default function ConsultationPage({
  params,
}: {
  params: Promise<{ encounterId: string }>;
}) {
  const { encounterId } = use(params);
  const { data, isLoading, error, reload } = useConsultation(encounterId);
  const { saveDraft, completeEncounter, isSaving, isCompleting, error: actionError } =
    useConsultationActions();
  const clinical = useDoctorPatient(data?.encounter?.patientId ?? "");
  const { can } = usePermissions();

  const seededFor = useRef<string | null>(null);
  const [form, setForm] = useState({
    chiefComplaint: "",
    symptoms: "",
    observations: "",
    assessment: "",
    plan: "",
  });
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.encounter && seededFor.current !== data.encounter.id) {
      seededFor.current = data.encounter.id;
      setForm({
        chiefComplaint: data.encounter.chiefComplaint,
        symptoms: data.encounter.symptoms,
        observations: data.encounter.observations,
        assessment: data.encounter.assessment,
        plan: data.encounter.plan,
      });
    }
  }, [data]);

  const handleFieldChange = useCallback(
    (field: keyof typeof form) => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setSaved(false);
    },
    []
  );

  const handleSaveDraft = useCallback(async () => {
    const ok = await saveDraft(encounterId, form);
    if (ok) setSaved(true);
  }, [saveDraft, encounterId, form]);

  const handleComplete = useCallback(async () => {
    const ok = await completeEncounter(encounterId, form);
    if (ok) {
      await doctorMockApi.completeConsultation(data?.encounter?.tokenNumber ?? "");
      setCompleted(true);
      setConfirmComplete(false);
    }
  }, [completeEncounter, encounterId, form, data]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !data?.encounter) {
    return <ErrorState message={error ?? "Consultation not found."} onRetry={reload} />;
  }

  const { encounter, patient } = data;
  const isDone = completed || encounter.status === "completed";

  if (isDone) {
    return (
      <div className="mx-auto max-w-xl">
        <section
          aria-labelledby="completed-title"
          className="rounded-card border border-ink-200 bg-surface p-6 text-center shadow-card"
        >
          <h1 id="completed-title" className="text-2xl font-bold text-ink-900">
            Consultation Completed
          </h1>
          <p className="mt-2 text-5xl font-bold tabular-nums text-brand-700">
            {encounter.tokenNumber}
          </p>
          <p className="mt-2 text-sm text-ink-500">
            {patient ? `${patient.name} · ${patient.id}` : encounter.patientId}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/doctor/queue"
              className="flex h-12 items-center justify-center rounded-btn bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Call Next Patient
            </Link>
            <Link
              href={`/doctor/patients/${patient?.id ?? encounter.patientId}`}
              className="flex h-12 items-center justify-center rounded-btn border border-ink-300 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              View Patient
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Consultation</h1>
          <p className="mt-1 text-sm text-ink-500">
            {patient ? `${patient.name} · #${patient.id}` : `Patient ${encounter.patientId}`} &middot; Token{" "}
            <span className="font-semibold tabular-nums">{encounter.tokenNumber}</span>
          </p>
        </div>
        <Link
          href="/doctor/queue"
          className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          Back to Queue
        </Link>
      </div>

      {clinical.data?.patient && (
        <section
          aria-labelledby="consult-clinical-title"
          className="rounded-card border border-ink-200 bg-surface p-4 shadow-card"
        >
          <h2 id="consult-clinical-title" className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Important Information
          </h2>
          {clinical.isLoading ? (
            <p className="mt-2 text-sm text-ink-500">Loading clinical summary...</p>
          ) : clinical.error ? (
            <p className="mt-2 text-sm text-status-danger">{clinical.error}</p>
          ) : (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex flex-wrap gap-1">
                <dt className="font-medium text-ink-900">Allergies:</dt>
                <dd className="text-ink-700">
                  {clinical.data.summary.allergies.length > 0
                    ? clinical.data.summary.allergies.map((a) => a.substance).join(", ")
                    : "None recorded"}
                </dd>
              </div>
              <div className="flex flex-wrap gap-1">
                <dt className="font-medium text-ink-900">Conditions:</dt>
                <dd className="text-ink-700">
                  {clinical.data.summary.conditions.filter((c) => c.status === "active").length > 0
                    ? clinical.data.summary.conditions
                        .filter((c) => c.status === "active")
                        .map((c) => c.name)
                        .join(", ")
                    : "None recorded"}
                </dd>
              </div>
              <div className="flex flex-wrap gap-1">
                <dt className="font-medium text-ink-900">Medications:</dt>
                <dd className="text-ink-700">
                  {clinical.data.summary.medications.length > 0
                    ? clinical.data.summary.medications
                        .map((m) => `${m.name} ${m.dosage}`)
                        .join(", ")
                    : "None recorded"}
                </dd>
              </div>
            </dl>
          )}
        </section>
      )}

      {saved && <SuccessMessage message="Draft saved." />}
      {actionError && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-4 text-sm text-status-danger">
          {actionError}
        </p>
      )}

      <form
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-col gap-4"
        aria-label="Consultation notes"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-900">Chief Complaint</span>
          <textarea
            className={textareaClass}
            value={form.chiefComplaint}
            onChange={handleFieldChange("chiefComplaint")}
            placeholder="Describe the patient's primary complaint"
            disabled={isSaving || isCompleting}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-900">Symptoms</span>
          <textarea
            className={textareaClass}
            value={form.symptoms}
            onChange={handleFieldChange("symptoms")}
            placeholder="Patient-reported symptoms"
            disabled={isSaving || isCompleting}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-900">Observations</span>
          <textarea
            className={textareaClass}
            value={form.observations}
            onChange={handleFieldChange("observations")}
            placeholder="Vitals and clinical observations"
            disabled={isSaving || isCompleting}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-900">Assessment</span>
          <textarea
            className={textareaClass}
            value={form.assessment}
            onChange={handleFieldChange("assessment")}
            placeholder="Differential diagnosis / assessment"
            disabled={isSaving || isCompleting}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-900">Plan</span>
          <textarea
            className={textareaClass}
            value={form.plan}
            onChange={handleFieldChange("plan")}
            placeholder="Prescriptions, tests, follow-up plan"
            disabled={isSaving || isCompleting}
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          {can("EDIT_ENCOUNTER") ? (
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={isSaving || isCompleting}
              onClick={handleSaveDraft}
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
          ) : (
            <p className="flex-1 rounded-btn border border-ink-200 bg-ink-100 px-4 py-3 text-center text-sm text-ink-500">
              You don&apos;t have permission to edit this consultation.
            </p>
          )}
          {can("COMPLETE_ENCOUNTER") && (
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={isSaving || isCompleting}
              onClick={() => setConfirmComplete(true)}
            >
              {isCompleting ? "Completing..." : "Complete Consultation"}
            </Button>
          )}
        </div>
      </form>

      <Dialog
        open={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        title="Complete consultation?"
      >
        <p className="text-sm text-ink-700">
          Mark the consultation for token{" "}
          <span className="font-semibold tabular-nums">{encounter.tokenNumber}</span> as complete? This
          will close the current consultation.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" disabled={isCompleting} onClick={() => setConfirmComplete(false)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={isCompleting} onClick={handleComplete}>
            {isCompleting ? "Completing..." : "Confirm"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

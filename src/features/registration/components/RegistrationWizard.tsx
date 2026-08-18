"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { registrationMockApi } from "../api/registration.mock";
import {
  useDuplicateChecker,
  useOpdAvailability,
  useRegistrationActions,
} from "../hooks/useRegistration";
import type {
  NewPatientInput,
  OPDRegistration,
  PatientSearchResult,
  PotentialDuplicate,
  RegistrationType,
  RegistrationRecord,
  OPDToken,
} from "../types/registration.types";
import { DuplicateWarning } from "./DuplicateWarning";
import { ExistingPatientCard } from "./ExistingPatientCard";
import { NewPatientForm } from "./NewPatientForm";
import { OPDSelector } from "./OPDSelector";
import { PatientSearch } from "./PatientSearch";
import { RegistrationSummary } from "./RegistrationSummary";
import { TokenSuccess } from "./TokenSuccess";

const STEPS: Array<{ n: 1 | 2 | 3 | 4 | 5; label: string }> = [
  { n: 1, label: "Patient" },
  { n: 2, label: "Details" },
  { n: 3, label: "OPD" },
  { n: 4, label: "Confirm" },
  { n: 5, label: "Token" },
];

type RegistrationWizardProps = {
  hospitalId: string;
  hospitalName: string;
  initialPatientId?: string;
};

export function RegistrationWizard({ hospitalId, hospitalName, initialPatientId }: RegistrationWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [patientType, setPatientType] = useState<"new" | "existing">("new");
  const [patient, setPatient] = useState<PatientSearchResult | null>(null);
  const [newPatientInput, setNewPatientInput] = useState<NewPatientInput | null>(null);
  const [duplicates, setDuplicates] = useState<PotentialDuplicate[]>([]);
  const [opd, setOpd] = useState<OPDRegistration | null>(null);
  const [registrationType, setRegistrationType] = useState<RegistrationType>("walk_in");
  const [appointmentId, setAppointmentId] = useState("");
  const [result, setResult] = useState<{ token: OPDToken; record: RegistrationRecord } | null>(null);

  const actions = useRegistrationActions();
  const duplicateChecker = useDuplicateChecker();
  const opds = useOpdAvailability(hospitalId);

  useEffect(() => {
    let cancelled = false;
    if (initialPatientId) {
      registrationMockApi.getPatientById(initialPatientId).then((found) => {
        if (cancelled) return;
        if (found) {
          setPatient(found);
          setPatientType("existing");
          setStep(2);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [initialPatientId]);

  async function createNewPatient(input: NewPatientInput) {
    const created = await actions.createPatient(input);
    if (!created) return;
    setPatient(created);
    setPatientType("new");
    setDuplicates([]);
    setStep(3);
  }

  async function handleNewPatientNext(input: NewPatientInput) {
    setNewPatientInput(input);
    const matches = await duplicateChecker.check(input.name, input.mobile);
    if (matches.length > 0) {
      setDuplicates(matches);
      return;
    }
    await createNewPatient(input);
  }

  async function handleUseExisting(patientId: string) {
    const found = await registrationMockApi.getPatientById(patientId);
    if (!found) return;
    setPatient(found);
    setPatientType("existing");
    setDuplicates([]);
    setStep(2);
  }

  function handleDuplicateContinue() {
    if (!newPatientInput) return;
    void createNewPatient(newPatientInput);
  }

  function handleSelectExisting(selected: PatientSearchResult) {
    setPatient(selected);
    setPatientType("existing");
    setStep(2);
  }

  function handleSelectOpd(selected: OPDRegistration) {
    setOpd(selected);
    setStep(4);
  }

  async function handleGenerate() {
    if (!patient || !opd) return;
    const generated = await actions.generate({
      patientId: patient.id,
      patientName: patient.name,
      opdId: opd.opdId,
      registrationType,
      appointmentId: appointmentId || undefined,
      isNewPatient: patientType === "new",
    });
    if (generated) {
      setResult(generated);
      setStep(5);
    }
  }

  function reset() {
    setStep(1);
    setPatientType("new");
    setPatient(null);
    setNewPatientInput(null);
    setDuplicates([]);
    setOpd(null);
    setRegistrationType("walk_in");
    setAppointmentId("");
    setResult(null);
  }

  const currentStepIndex = STEPS.findIndex((s) => s.n === step);

  return (
    <div className="flex flex-col gap-6">
      <ol aria-label="Registration steps" className="flex flex-wrap items-center gap-1">
        {STEPS.map((item, index) => {
          const state = index < currentStepIndex ? "done" : index === currentStepIndex ? "current" : "pending";
          return (
            <li key={item.n} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true" className="mx-1 h-px w-4 bg-ink-300" />}
              <span
                aria-current={state === "current" ? "step" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  state === "current"
                    ? "bg-brand-600 text-white"
                    : state === "done"
                      ? "bg-brand-100 text-brand-700"
                      : "bg-ink-100 text-ink-500"
                }`}
              >
                <span className="tabular-nums">{item.n}</span>
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Find Patient</h2>
            <p className="text-sm text-ink-500">
              Search by patient ID, mobile number or name across registered hospitals.
            </p>
          </div>
          <PatientSearch
            autoFocus
            onSelect={handleSelectExisting}
            onRegisterNew={() => {
              setPatientType("new");
              setStep(2);
            }}
          />
        </div>
      )}

      {step === 2 && patientType === "existing" && patient && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink-900">Existing Patient</h2>
          <ExistingPatientCard
            patient={patient}
            onClear={() => {
              setPatient(null);
              setStep(1);
            }}
          />
          <Button onClick={() => setStep(3)}>Continue to OPD</Button>
        </div>
      )}

      {step === 2 && patientType === "new" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink-900">New Patient Registration</h2>
          <p className="text-sm text-ink-500">
            The patient ID is generated by the system and is read-only. Only essential information is
            collected.
          </p>
          {duplicates.length > 0 ? (
            <DuplicateWarning
              matches={duplicates}
              busy={actions.busy}
              onUseExisting={handleUseExisting}
              onContinue={handleDuplicateContinue}
            />
          ) : (
            <NewPatientForm busy={duplicateChecker.busy || actions.busy} onNext={handleNewPatientNext} />
          )}
          {actions.error && (
            <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-4 text-sm text-status-danger">
              {actions.error}
            </p>
          )}
          {patientType === "new" && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-left text-sm font-medium text-brand-700 hover:underline"
            >
              &larr; Back to search
            </button>
          )}
        </div>
      )}

      {step === 3 && patient && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Select OPD</h2>
            <p className="text-sm text-ink-500">
              For {patient.name}. Only OPD sessions at {hospitalName} are shown.
            </p>
          </div>
          <OPDSelector
            opds={opds.data ?? []}
            selectedOpdId={opd?.opdId}
            isLoading={opds.isLoading}
            onSelect={handleSelectOpd}
          />
          <button
            type="button"
            onClick={() => setStep(2)}
            className="text-left text-sm font-medium text-brand-700 hover:underline"
          >
            &larr; Back to patient
          </button>
        </div>
      )}

      {step === 4 && patient && opd && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink-900">Confirm Registration</h2>
          <RegistrationSummary
            patientName={patient.name}
            patientId={patient.id}
            isNewPatient={patientType === "new"}
            departmentName={opd.departmentName}
            opdName={opd.opdName}
            doctorName={opd.doctorName}
            registrationType={registrationType}
            onTypeChange={setRegistrationType}
            appointmentId={appointmentId}
            onAppointmentIdChange={setAppointmentId}
            onBack={() => setStep(3)}
            onGenerate={handleGenerate}
            busy={actions.busy}
            error={actions.error}
          />
        </div>
      )}

      {step === 5 && result && (
        <TokenSuccess
          token={result.token}
          hospitalName={hospitalName}
          doctorName={opd?.doctorName ?? ""}
          onRegisterAnother={reset}
        />
      )}
    </div>
  );
}
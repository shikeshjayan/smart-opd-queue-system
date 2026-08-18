"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RegistrationType } from "../types/registration.types";

type RegistrationSummaryProps = {
  patientName: string;
  patientId: string;
  isNewPatient: boolean;
  departmentName: string;
  opdName: string;
  doctorName: string;
  registrationType: RegistrationType;
  onTypeChange: (type: RegistrationType) => void;
  appointmentId?: string;
  onAppointmentIdChange?: (id: string) => void;
  onBack: () => void;
  onGenerate: () => void;
  busy?: boolean;
  error?: string | null;
};

export function RegistrationSummary({
  patientName,
  patientId,
  isNewPatient,
  departmentName,
  opdName,
  doctorName,
  registrationType,
  onTypeChange,
  appointmentId,
  onAppointmentIdChange,
  onBack,
  onGenerate,
  busy,
  error,
}: RegistrationSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <dl className="divide-y divide-ink-100 text-sm">
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Patient</dt>
            <dd className="font-medium text-ink-900">
              {patientName} <span className="font-mono text-xs text-ink-500">({patientId})</span>
              {isNewPatient && (
                <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                  New
                </span>
              )}
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Department</dt>
            <dd className="font-medium text-ink-900">{departmentName}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">OPD</dt>
            <dd className="font-medium text-ink-900">{opdName}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Doctor</dt>
            <dd className="font-medium text-ink-900">{doctorName}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink-500">Token</dt>
            <dd className="font-medium text-ink-900">Next available</dd>
          </div>
        </dl>
      </div>

      <fieldset className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <legend className="px-1 text-sm font-medium text-ink-700">Registration type</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-ink-900">
            <input
              type="radio"
              name="registrationType"
              checked={registrationType === "walk_in"}
              onChange={() => onTypeChange("walk_in")}
            />
            Walk-in
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-900">
            <input
              type="radio"
              name="registrationType"
              checked={registrationType === "appointment"}
              onChange={() => onTypeChange("appointment")}
            />
            Appointment
          </label>
        </div>
        {registrationType === "appointment" && (
          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Appointment ID</span>
            <Input
              value={appointmentId ?? ""}
              onChange={(e) => onAppointmentIdChange?.(e.target.value)}
              placeholder="APT-xxxx"
            />
          </label>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-4 text-sm text-status-danger">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" disabled={busy} onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" disabled={busy} onClick={onGenerate}>
          {busy ? "Generating..." : "Generate Token"}
        </Button>
      </div>
    </div>
  );
}
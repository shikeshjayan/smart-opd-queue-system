import type { Encounter, PatientSummary } from "@/types";

export type ChiefComplaint = {
  text: string;
  duration?: string;
};

export type VitalSigns = {
  bpSystolic?: number;
  bpDiastolic?: number;
  pulse?: number;
  temperature?: number;
  respiratoryRate?: number;
  spo2?: number;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
};

export type Examination = {
  general?: string;
  system?: string;
  other?: string;
};

export type DiagnosisType = "primary" | "secondary";

export type Diagnosis = {
  code?: string;
  name: string;
  type: DiagnosisType;
};

export type FollowUpDecision = "none" | "return" | "refer" | "review";

export type FollowUp = {
  decision: FollowUpDecision;
  date?: string;
  notes?: string;
};

export type ConsultationRecord = {
  encounterId: string;
  chiefComplaint: ChiefComplaint;
  symptoms: string[];
  vitals: VitalSigns;
  examination: Examination;
  diagnoses: Diagnosis[];
  treatmentPlan: string;
  followUp: FollowUp;
  updatedAt?: string;
  version?: number;
  status?: "draft" | "completed" | "amended";
  editedBy?: string;
  editedByName?: string;
  lockedBy?: string | null;
  lockedAt?: string | null;
  amendedFrom?: string;
};

export type ConsultationSections = {
  chiefComplaint: ChiefComplaint;
  symptoms: string[];
  vitals: VitalSigns;
  examination: Examination;
  diagnoses: Diagnosis[];
  treatmentPlan: string;
  followUp: FollowUp;
};

export type ConsultationContext = {
  encounter: Encounter;
  patient: PatientSummary | null;
  record: ConsultationRecord;
};

export function emptyRecord(encounterId: string): ConsultationRecord {
  return {
    encounterId,
    chiefComplaint: { text: "" },
    symptoms: [],
    vitals: {},
    examination: {},
    diagnoses: [],
    treatmentPlan: "",
    followUp: { decision: "none" },
    version: 1,
    status: "draft",
  };
}

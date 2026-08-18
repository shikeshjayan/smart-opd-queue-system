import type { Encounter, PatientSummary } from "@/types";

export type VisitType = "consultation" | "follow-up" | "review";

export type EncounterStatus = Encounter["status"];

export type PatientEncounter = {
  id: string;
  patientId: string;
  hospitalId: string;
  hospitalName: string;
  departmentId: string;
  departmentName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  reason: string;
  visitType: VisitType;
  status: EncounterStatus;
  createdAt: string;
};

export type ConditionStatus = "active" | "resolved" | "inactive" | "unknown";

export type AllergySeverity = "mild" | "moderate" | "severe";

export type Allergy = {
  id: string;
  patientId: string;
  substance: string;
  reaction?: string;
  severity?: AllergySeverity;
  status: "active" | "inactive";
};

export type Condition = {
  id: string;
  patientId: string;
  name: string;
  status: ConditionStatus;
  since?: string;
};

export type Medication = {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  status: "active" | "stopped";
};

export type MedicineItem = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

export type Prescription = {
  id: string;
  patientId: string;
  encounterId: string;
  issuedAt: string;
  hospitalName: string;
  departmentName: string;
  doctorName: string;
  medicines: MedicineItem[];
  instructions?: string;
  status: "active" | "completed" | "cancelled";
};

export type LabResult = {
  name: string;
  value: string;
  unit?: string;
  range?: string;
};

export type LabReport = {
  id: string;
  patientId: string;
  encounterId: string;
  name: string;
  labName: string;
  hospitalName: string;
  collectedAt: string;
  reportedAt: string;
  status: "pending" | "completed";
  results?: LabResult[];
};

export type MedicalDocumentType =
  | "lab_report"
  | "prescription"
  | "discharge_summary"
  | "referral"
  | "medical_certificate"
  | "other";

export type MedicalDocument = {
  id: string;
  patientId: string;
  encounterId: string;
  name: string;
  type: MedicalDocumentType;
  date: string;
  hospitalName: string;
  storageKey?: string;
  uploadedAt: string;
};

export type EncounterDetail = {
  encounter: PatientEncounter;
  chiefComplaint: string;
  summary: string;
  plan: string;
  diagnosis: {
    id: string;
    name: string;
    status: ConditionStatus;
  } | null;
  prescriptions: Prescription[];
  labs: LabReport[];
  followUp: string | null;
};

export type MedicalSummary = {
  patient: PatientSummary;
  totalVisits: number;
  allergyCount: number;
  activeConditionCount: number;
  medicationCount: number;
  allergies: Allergy[];
  conditions: Condition[];
  medications: Medication[];
};

export type HistoryFilters = {
  keyword: string;
  year?: string;
  hospitalId?: string;
  departmentId?: string;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type HistoryFacets = {
  years: string[];
  hospitals: { id: string; name: string }[];
  departments: { id: string; name: string }[];
};

export type PatientHistoryView = {
  patient: PatientSummary;
  summary: MedicalSummary;
  encounters: PatientEncounter[];
  facets: HistoryFacets;
};

export type PatientProfileView = {
  id: string;
  name: string;
  age: number;
  gender: PatientSummary["gender"];
  phone: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  email?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
  languagePreference: string;
  allergies: Allergy[];
  conditions: Condition[];
  medications: Medication[];
};

export type DoctorPatientView = {
  patient: PatientSummary;
  summary: MedicalSummary;
  encounters: PatientEncounter[];
  facets: HistoryFacets;
};

export type RecordAudience = "patient" | "doctor";
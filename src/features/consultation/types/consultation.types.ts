import type { ConsultationSections } from "@/services/consultation";

export type ConsultationFormState = ConsultationSections;

export type SaveStatus = "idle" | "saving" | "saved";

export type CompletionChecklist = {
  diagnosisEntered: boolean;
  treatmentRecorded: boolean;
  requiredFieldsComplete: boolean;
  followUpRecorded: boolean;
};
import { useAsync } from "@/lib/use-async";
import { DEMO_PATIENT_ID } from "@/config/app";
import { medicationsMockApi } from "../api/medication.mock";
import { medicalRecordsMockApi } from "@/features/medical-records/api/medical-records.mock";

export function usePatientMedicationPanel() {
  const medications = useAsync(() => medicationsMockApi.listForPatient(DEMO_PATIENT_ID), []);
  const history = useAsync(() => medicalRecordsMockApi.getHistory(DEMO_PATIENT_ID), []);

  return {
    medications,
    allergies: history.data?.summary.allergies ?? null,
    isLoading: medications.isLoading || history.isLoading,
    error: medications.error ?? history.error,
  };
}
import { useAsync } from "@/lib/use-async";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { medicationsMockApi } from "../api/medication.mock";
import { medicalRecordsMockApi } from "@/features/medical-records/api/medical-records.mock";

export function usePatientMedicationPanel() {
  const { user } = useAuth();
  const patientId = user?.id ?? "";

  const medications = useAsync(() => medicationsMockApi.listForPatient(patientId), [patientId]);
  const history = useAsync(() => medicalRecordsMockApi.getHistory(patientId), [patientId]);

  return {
    medications,
    allergies: history.data?.summary.allergies ?? null,
    isLoading: medications.isLoading || history.isLoading,
    error: medications.error ?? history.error,
  };
}

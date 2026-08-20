import { useAsync } from "@/lib/use-async";
import { prescriptionMockApi } from "@/features/prescription/api/prescription.mock";

export function useMedications(patientId: string) {
  return useAsync(() => prescriptionMockApi.listRegimen(patientId), [patientId]);
}
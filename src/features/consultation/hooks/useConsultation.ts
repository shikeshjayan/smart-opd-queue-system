import { useAsync } from "@/lib/use-async";
import { consultationMockApi } from "../api/consultation.mock";

export function useConsultationContext(encounterId: string) {
  return useAsync(() => consultationMockApi.getContext(encounterId), [encounterId]);
}

export function useConsultationForPatient(patientId: string) {
  return useAsync(() => consultationMockApi.getOrCreateForPatient(patientId), [patientId]);
}
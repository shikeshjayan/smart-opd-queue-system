import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { prescriptionMockApi } from "../api/prescription.mock";

export function usePrescriptionHistory(patientId: string) {
  return useAsync(() => prescriptionMockApi.listForPatient(patientId), [patientId]);
}

export function useActiveMedications(patientId: string) {
  return useAsync(() => prescriptionMockApi.listRegimen(patientId), [patientId]);
}

export function useRegimenActions() {
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function discontinue(regimenId: string, reason: string) {
    setRunning(regimenId);
    setError(null);
    try {
      await prescriptionMockApi.discontinueRegimen(regimenId, reason);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to discontinue medication");
      return false;
    } finally {
      setRunning(null);
    }
  }

  return { discontinue, running, error };
}
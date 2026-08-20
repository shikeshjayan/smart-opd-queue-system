import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { DEMO_PATIENT_ID } from "@/config/app";
import { prescriptionMockApi } from "../api/prescription.mock";

export function usePrescriptionHistory(patientId: string) {
  return useAsync(() => prescriptionMockApi.listForPatient(patientId), [patientId]);
}

export function useActiveMedications(patientId: string) {
  return useAsync(() => prescriptionMockApi.listRegimen(patientId), [patientId]);
}

export function usePatientPrescriptions(page: number, pageSize: number) {
  return useAsync(async () => {
    const all = await prescriptionMockApi.listForPatient(DEMO_PATIENT_ID);
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length,
      page,
      pageSize,
    };
  }, [page, pageSize]);
}

export function usePatientPrescription(prescriptionId: string) {
  return useAsync(() => prescriptionMockApi.getById(prescriptionId), [prescriptionId]);
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
import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { doctorMockApi } from "../api/doctor.mock";
import type { Encounter } from "@/types";

export function useDoctorDashboard() {
  return useAsync(() => doctorMockApi.getDashboard(), []);
}

export function useOpdSummary() {
  return useAsync(() => doctorMockApi.getOpdSummary(), []);
}

export function usePatient(patientId: string) {
  return useAsync(() => doctorMockApi.getPatient(patientId), [patientId]);
}

export function useConsultation(encounterId: string) {
  return useAsync(() => doctorMockApi.getConsultationContext(encounterId), [encounterId]);
}

export function useConsultationActions() {
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveDraft(encounterId: string, patch: Partial<Encounter>) {
    setIsSaving(true);
    setError(null);
    try {
      await doctorMockApi.saveDraft(encounterId, patch);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to save draft");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function completeEncounter(encounterId: string, patch: Partial<Encounter>) {
    setIsCompleting(true);
    setError(null);
    try {
      await doctorMockApi.completeEncounter(encounterId, patch);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to complete consultation");
      return false;
    } finally {
      setIsCompleting(false);
    }
  }

  return { saveDraft, completeEncounter, isSaving, isCompleting, error };
}

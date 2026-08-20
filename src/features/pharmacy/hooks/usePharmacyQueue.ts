import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { pharmacyMockApi } from "../api/pharmacy.mock";

export function usePharmacyQueue() {
  return useAsync(() => pharmacyMockApi.getQueue(), []);
}

export function usePharmacyActions() {
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "dispatch" | "dispense", prescriptionId: string) {
    setRunning(prescriptionId);
    setError(null);
    try {
      if (action === "dispatch") await pharmacyMockApi.dispatch(prescriptionId);
      else await pharmacyMockApi.dispense(prescriptionId);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Pharmacy action failed.");
      return false;
    } finally {
      setRunning(null);
    }
  }

  return { run, running, error };
}
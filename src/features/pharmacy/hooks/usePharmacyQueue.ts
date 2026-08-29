import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { pharmacyApi } from "../api/pharmacy.api";

export function usePharmacyQueue() {
  return useAsync(() => pharmacyApi.getQueue(), []);
}

export function usePharmacyActions() {
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(
    action: "dispatch" | "dispense",
    prescriptionId: string,
    options?: { hospitalId?: string; items?: { medicineId: string; itemId?: string; qty: number }[] }
  ) {
    setRunning(prescriptionId);
    setError(null);
    try {
      if (action === "dispatch") await pharmacyApi.dispatch(prescriptionId);
      else
        await pharmacyApi.dispense(prescriptionId, options?.hospitalId, options?.items ?? []);
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
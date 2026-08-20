import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { getPatient } from "@/services/data";
import type { ResultValue } from "@/services/diagnostics/types";
import { diagnosticsMockApi } from "../api/diagnostics.mock";

export function useResultsByOrder(orderId: string | null | undefined) {
  return useAsync(
    () => (orderId ? diagnosticsMockApi.listResultsForOrder(orderId) : Promise.resolve([])),
    [orderId]
  );
}

export function useDoctorResults(doctorId: string) {
  return useAsync(() => diagnosticsMockApi.listDoctorResults(doctorId), [doctorId]);
}

export function usePatientTests(patientId: string) {
  return useAsync(() => diagnosticsMockApi.listPatientTests(patientId), [patientId]);
}

export function useLabOverview() {
  return useAsync(async () => {
    const orders = await diagnosticsMockApi.listAll();
    const specimens = (
      await Promise.all(orders.map((order) => diagnosticsMockApi.getSpecimenForOrder(order.id)))
    ).filter((s): s is NonNullable<typeof s> => Boolean(s));
    const results = (
      await Promise.all(orders.map((order) => diagnosticsMockApi.listResultsForOrder(order.id)))
    ).flat();
    const patientIds = [...new Set(orders.map((o) => o.patientId))];
    const patients = Object.fromEntries(
      patientIds.map((id) => [id, getPatient(id)?.name ?? "Patient"])
    );
    return { orders, specimens, results, patients };
  }, []);
}

export function useDiagnosticResultActions() {
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(key: string, action: () => Promise<T>): Promise<T | null> {
    setRunning(key);
    setError(null);
    try {
      return await action();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Laboratory action failed.");
      return null;
    } finally {
      setRunning(null);
    }
  }

  return {
    running,
    error,
    saveDraft: (orderId: string, testId: string, values: ResultValue[], notes?: string) =>
      run(`draft:${orderId}:${testId}`, () =>
        diagnosticsMockApi.saveResultDraft(orderId, testId, values, notes)
      ),
    finalize: (resultId: string) =>
      run(`finalize:${resultId}`, () => diagnosticsMockApi.finalizeResult(resultId)),
    amend: (orderId: string, testId: string) =>
      run(`amend:${orderId}:${testId}`, () => diagnosticsMockApi.amendResult(orderId, testId)),
    cancel: (resultId: string, reason?: string) =>
      run(`cancel:${resultId}`, () => diagnosticsMockApi.cancelResult(resultId, reason)),
    collect: (orderId: string, type: string) =>
      run(`collect:${orderId}`, () => diagnosticsMockApi.collectSpecimen(orderId, type)),
    reject: (orderId: string, reason: string) =>
      run(`reject:${orderId}`, () => diagnosticsMockApi.rejectSpecimen(orderId, reason)),
    process: (orderId: string) =>
      run(`process:${orderId}`, () => diagnosticsMockApi.startProcessing(orderId)),
    review: (resultId: string, reviewerId: string) =>
      run(`review:${resultId}`, () => diagnosticsMockApi.markReviewed(resultId, reviewerId)),
  };
}
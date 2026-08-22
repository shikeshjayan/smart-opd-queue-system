"use client";

import { useAsync } from "@/lib/use-async";
import { stateAdminMockApi } from "../api/state-admin.mock";
import type { StateFilters } from "../types/state-admin.types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useState } from "react";
import type { AuditActor } from "@/services/hospital-ops/types";

export function useStateStats() {
  return useAsync(() => stateAdminMockApi.getStats(), []);
}

export function useDistrictComparison() {
  return useAsync(() => stateAdminMockApi.listDistrictComparison(), []);
}

export function useStateHospitals(filters: StateFilters & { query?: string }) {
  return useAsync(() => stateAdminMockApi.listHospitalDirectory(filters), [JSON.stringify(filters)]);
}

export function useServiceAvailability() {
  return useAsync(() => stateAdminMockApi.getServiceAvailability(), []);
}

export function useCapacityByDistrict() {
  return useAsync(() => stateAdminMockApi.getCapacityByDistrict(), []);
}

export function useStateAnnouncements() {
  return useAsync(() => stateAdminMockApi.listAnnouncements(), []);
}

export function useStateAuditLog() {
  return useAsync(() => stateAdminMockApi.getAuditLog(), []);
}

export function useStateMutations() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actor: AuditActor = {
    id: user?.id ?? "unknown",
    name: user?.name ?? "Unknown Admin",
    role: "State Admin",
  };

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
  publishAnnouncement: (input: any) => run(() => stateAdminMockApi.publishAnnouncement(input, actor)),
};
}


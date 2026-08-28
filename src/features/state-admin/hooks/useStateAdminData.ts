"use client";

import { useAsync } from "@/lib/use-async";
import type { StateFilters } from "../types/state-admin.types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useState } from "react";
import {
  getStateStats,
  listDistrictComparison,
  listHospitalDirectory,
  getServiceAvailability,
  getCapacityByDistrict,
  listAnnouncements,
  publishAnnouncement,
  getAuditLog,
} from "@/server/actions/state-admin";

export function useStateStats() {
  return useAsync(() => getStateStats(), []);
}

export function useDistrictComparison() {
  return useAsync(() => listDistrictComparison(), []);
}

export function useStateHospitals(filters: StateFilters & { query?: string }) {
  return useAsync(() => listHospitalDirectory(filters), [JSON.stringify(filters)]);
}

export function useServiceAvailability() {
  return useAsync(() => getServiceAvailability(), []);
}

export function useCapacityByDistrict() {
  return useAsync(() => getCapacityByDistrict(), []);
}

export function useStateAnnouncements() {
  return useAsync(() => listAnnouncements(), []);
}

export function useStateAuditLog() {
  return useAsync(() => getAuditLog(), []);
}

export function useStateMutations() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
    publishAnnouncement: (input: Parameters<typeof publishAnnouncement>[0]) =>
      run(() => publishAnnouncement(input)),
  };
}

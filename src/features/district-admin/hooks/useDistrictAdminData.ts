"use client";

import { useAsync } from "@/lib/use-async";
import { districtAdminMockApi } from "../api/district-admin.mock";
import type { DistrictFilters } from "../types/district-admin.types";
import type { DistrictId } from "@/config/districts";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useState } from "react";
import type { AuditActor } from "@/services/hospital-ops/types";

export function useDistrictDashboard(districtId: DistrictId, filters: DistrictFilters) {
  return useAsync(() => districtAdminMockApi.getDashboard(districtId, filters), [districtId, JSON.stringify(filters)]);
}

export function useDistrictAnalytics(districtId: DistrictId, period: "today" | "week" | "month", filters: DistrictFilters) {
  return useAsync(() => districtAdminMockApi.getAnalytics(districtId, period, filters), [districtId, period, JSON.stringify(filters)]);
}

export function useDistrictHospitals(districtId: DistrictId) {
  return useAsync(() => districtAdminMockApi.listHospitalRows(districtId), [districtId]);
}

export function useDistrictComparison(districtId: DistrictId) {
  return useAsync(() => districtAdminMockApi.getComparison(districtId), [districtId]);
}

export function useDistrictCapacity(districtId: DistrictId) {
  return useAsync(() => districtAdminMockApi.getCapacity(districtId), [districtId]);
}

export function useDistrictResources(districtId: DistrictId) {
  return useAsync(() => districtAdminMockApi.getResources(districtId), [districtId]);
}

export function useHospitalDoctorAvailability(hospitalId: string) {
  return useAsync(() => districtAdminMockApi.getDoctorAvailability(hospitalId), [hospitalId]);
}

export function useDistrictServiceMatrix(districtId: DistrictId) {
  return useAsync(() => districtAdminMockApi.getServiceMatrix(districtId), [districtId]);
}

export function useDistrictReferrals(districtId: DistrictId) {
  return useAsync(() => districtAdminMockApi.getReferrals(districtId), [districtId]);
}

export function useDistrictAnnouncements(districtId: DistrictId) {
  return useAsync(() => districtAdminMockApi.listAnnouncements(districtId), [districtId]);
}

export function useDistrictAudit(districtId: DistrictId, filters: { action?: string; query?: string }) {
  return useAsync(() => districtAdminMockApi.listAudit(districtId, filters), [districtId, JSON.stringify(filters)]);
}

export function useDistrictSettings(districtId: DistrictId) {
  return useAsync(() => districtAdminMockApi.getSettings(districtId), [districtId]);
}

export function useDistrictReport(districtId: DistrictId, type: string, filters: DistrictFilters) {
  return useAsync(() => districtAdminMockApi.getReport(districtId, type, filters), [districtId, type, JSON.stringify(filters)]);
}

export function useDistrictMutations() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actor: AuditActor = {
    id: user?.id ?? "unknown",
    name: user?.name ?? "Unknown Admin",
    role: "District Admin",
  };

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
    publishAnnouncement: (input: any) => run(() => districtAdminMockApi.publishAnnouncement(input, actor)),
    saveSettings: (districtId: DistrictId, settings: any) => run(() => districtAdminMockApi.saveSettings(districtId, settings, actor)),
  };
}

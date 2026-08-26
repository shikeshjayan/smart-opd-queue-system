"use client";

import { useAsync } from "@/lib/use-async";
import type { DistrictFilters, DistrictReportType } from "../types/district-admin.types";
import type { DistrictId } from "@/config/districts";
import { DEFAULT_DISTRICT_FILTERS } from "@/services/district/types";
import {
  getDistrictDashboard,
  getDistrictAnalytics,
  listDistrictHospitalRows,
  getDistrictComparison,
  getDistrictCapacity,
  getDistrictResources,
  getHospitalDoctorAvailability,
  getDistrictServiceMatrix,
  getDistrictReferrals,
  listDistrictAnnouncements,
  publishDistrictAnnouncement,
  listDistrictAudit,
  getDistrictSettings,
  saveDistrictSettings,
  getDistrictReport,
  toggleDistrictHospitalActive,
} from "@/server/actions/district-admin";

export function useDistrictDashboard(districtId: DistrictId, filters: DistrictFilters = DEFAULT_DISTRICT_FILTERS) {
  return useAsync(() => getDistrictDashboard(districtId, filters), [districtId, JSON.stringify(filters)]);
}

export function useDistrictAnalytics(districtId: DistrictId, period: "today" | "weekly" | "monthly", filters: DistrictFilters = DEFAULT_DISTRICT_FILTERS) {
  return useAsync(() => getDistrictAnalytics(districtId, period, filters), [districtId, period, JSON.stringify(filters)]);
}

export function useDistrictHospitals(districtId: DistrictId) {
  return useAsync(() => listDistrictHospitalRows(districtId), [districtId]);
}

export function useDistrictComparison(districtId: DistrictId) {
  return useAsync(() => getDistrictComparison(districtId), [districtId]);
}

export function useDistrictCapacity(districtId: DistrictId) {
  return useAsync(() => getDistrictCapacity(districtId), [districtId]);
}

export function useDistrictResources(districtId: DistrictId) {
  return useAsync(() => getDistrictResources(districtId), [districtId]);
}

export function useHospitalDoctorAvailability(hospitalId: string) {
  return useAsync(() => getHospitalDoctorAvailability(hospitalId), [hospitalId]);
}

export function useDistrictServiceMatrix(districtId: DistrictId) {
  return useAsync(() => getDistrictServiceMatrix(districtId), [districtId]);
}

export function useDistrictReferrals(districtId: DistrictId) {
  return useAsync(() => getDistrictReferrals(districtId), [districtId]);
}

export function useDistrictAnnouncements(districtId: DistrictId) {
  return useAsync(() => listDistrictAnnouncements(districtId), [districtId]);
}

export function useDistrictAudit(districtId: DistrictId) {
  return useAsync(() => listDistrictAudit(districtId), [districtId]);
}

export function useDistrictSettings(districtId: DistrictId) {
  return useAsync(() => getDistrictSettings(districtId), [districtId]);
}

export function useDistrictReport(districtId: DistrictId, type: DistrictReportType, filters: DistrictFilters = DEFAULT_DISTRICT_FILTERS) {
  return useAsync(() => getDistrictReport(districtId, type, filters), [districtId, type, JSON.stringify(filters)]);
}

export {
  publishDistrictAnnouncement as districtPublishAnnouncement,
  saveDistrictSettings as districtSaveSettings,
  toggleDistrictHospitalActive as districtToggleHospitalActive,
};

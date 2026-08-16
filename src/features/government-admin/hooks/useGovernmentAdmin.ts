import { useAsync } from "@/lib/use-async";
import { governmentMockApi } from "../api/government.mock";
import type { DistrictId } from "@/config/districts";
import type { QueueMonitorFilters } from "@/services/government/types";
import type { GovernmentAlertSeverity, GovernmentAlertStatus } from "@/types";

export function useDistrictDashboard(districtId: DistrictId) {
  return useAsync(() => governmentMockApi.getDistrictDashboard(districtId), [districtId]);
}

export function useStateDashboard() {
  return useAsync(() => governmentMockApi.getStateDashboard(), []);
}

export function useDistricts() {
  return useAsync(() => governmentMockApi.listDistricts(), []);
}

export function useDistrictPerformance(districtId: DistrictId) {
  return useAsync(() => governmentMockApi.getDistrictPerformance(districtId), [districtId]);
}

export function useHospitalsByDistrict(districtId: DistrictId) {
  return useAsync(() => governmentMockApi.listHospitalsByDistrict(districtId), [districtId]);
}

export function useHospitalDetail(hospitalId: string) {
  return useAsync(() => governmentMockApi.getHospitalDetail(hospitalId), [hospitalId]);
}

export function useQueueMonitor(districtIds: DistrictId[], filters: QueueMonitorFilters = {}) {
  const key = [
    districtIds.join(","),
    filters.hospitalId ?? "",
    filters.departmentId ?? "",
    filters.status ?? "",
    filters.minWaiting ?? "",
  ].join("|");
  return useAsync(() => governmentMockApi.listQueueMonitor(districtIds, filters), [key]);
}

export function useAlerts(
  districtIds: DistrictId[] | null,
  filters: {
    hospitalId?: string;
    severity?: GovernmentAlertSeverity | "";
    status?: GovernmentAlertStatus | "";
  } = {}
) {
  const key = [
    districtIds?.join(",") ?? "all",
    filters.hospitalId ?? "",
    filters.severity ?? "",
    filters.status ?? "",
  ].join("|");
  return useAsync(() => governmentMockApi.listAlerts(districtIds, filters), [key]);
}

export function useReports(
  scope: "state" | "district",
  districtId: DistrictId | null,
  filters: {
    hospitalId?: string;
    departmentId?: string;
    from?: string;
    to?: string;
  } = {}
) {
  const key = [
    scope,
    districtId ?? "",
    filters.hospitalId ?? "",
    filters.departmentId ?? "",
    filters.from ?? "",
    filters.to ?? "",
  ].join("|");
  return useAsync(() => governmentMockApi.getReport(scope, districtId, filters), [key]);
}

export function useGovernmentHospitals() {
  return useAsync(() => governmentMockApi.listHospitals(), []);
}

export function useGovernmentHospitalRows() {
  return useAsync(() => governmentMockApi.listHospitalRows(), []);
}

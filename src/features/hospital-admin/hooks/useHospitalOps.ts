"use client";

import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { roleLabel } from "@/features/auth/roles";
import { hospitalOpsService } from "@/services/hospital-ops";
import type {
  AuditActor,
  DashboardFilters,
  DepartmentConfig,
  DepartmentQueueConfig,
  HospitalServiceEntry,
  OperationalAuditAction,
  OpdWeeklySchedule,
  ReportType,
  AssignableUserRole,
  ScheduleException,
  ScheduleExceptionType,
  StaffProfile,
  TokenConfig,
} from "@/services/hospital-ops/types";

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  dateRange: "today",
  departmentId: "",
  doctorId: "",
  shift: "all",
};

function useActor(): AuditActor | undefined {
  const { user } = useAuth();
  if (!user) return undefined;
  return { id: user.id, name: user.name, role: roleLabel(user.role) };
}

export function useOpsDashboard(hospitalId: string, filters: DashboardFilters) {
  return useAsync(() => hospitalOpsService.getDashboard(hospitalId, filters), [hospitalId, filters]);
}

export function useWeeklySchedule(departmentId: string) {
  return useAsync(() => hospitalOpsService.getWeeklySchedule(departmentId), [departmentId]);
}

export function useExceptions(hospitalId: string) {
  return useAsync(() => hospitalOpsService.listExceptions(hospitalId), [hospitalId]);
}

export function useDepartmentConfigs(hospitalId: string) {
  return useAsync(() => hospitalOpsService.listDepartmentConfigs(hospitalId), [hospitalId]);
}

export function useQueueConfigs(hospitalId: string) {
  return useAsync(() => hospitalOpsService.listQueueConfigs(hospitalId), [hospitalId]);
}

export function useTokenConfig(hospitalId: string) {
  return useAsync(() => hospitalOpsService.getTokenConfig(hospitalId), [hospitalId]);
}

export function useServices(hospitalId: string) {
  return useAsync(() => hospitalOpsService.listServices(hospitalId), [hospitalId]);
}

export function useStaffProfiles(hospitalId: string) {
  return useAsync(() => hospitalOpsService.listStaffProfiles(hospitalId), [hospitalId]);
}

export function useRoleAssignments(hospitalId: string) {
  return useAsync(() => hospitalOpsService.listRoleAssignments(hospitalId), [hospitalId]);
}

export function useOpsAudit(
  hospitalId: string,
  filters: { action?: OperationalAuditAction | ""; query?: string }
) {
  return useAsync(() => hospitalOpsService.listAudit(hospitalId, filters), [
    hospitalId,
    filters.action,
    filters.query,
  ]);
}

export function useOpsReport(hospitalId: string, type: ReportType) {
  return useAsync(() => hospitalOpsService.getReport(hospitalId, type), [hospitalId, type]);
}

export function useAffectedAppointments() {
  const [busy, setBusy] = useState(false);
  async function load(exception: ScheduleException) {
    setBusy(true);
    try {
      return await hospitalOpsService.getAffectedAppointments(exception);
    } finally {
      setBusy(false);
    }
  }
  return { busy, load };
}

export function useOpsMutations() {
  const actor = useActor();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
    saveDepartmentConfig: (config: DepartmentConfig) =>
      run(() => hospitalOpsService.saveDepartmentConfig(config, actor)),
    saveStaffProfile: (profile: StaffProfile) =>
      run(() => hospitalOpsService.saveStaffProfile(profile, actor)),
    nextEmployeeId: (hospitalId: string, role: StaffProfile["role"]) =>
      run(() => hospitalOpsService.nextEmployeeId(hospitalId, role)),
    assignRole: (
      input: { userId: string; userName: string; departmentId?: string; role: AssignableUserRole },
      hospitalId: string
    ) => run(() => hospitalOpsService.assignRole(input, hospitalId, actor)),
    removeRoleAssignment: (id: string) => run(() => hospitalOpsService.removeRoleAssignment(id, actor)),
    saveWeeklySchedule: (schedule: OpdWeeklySchedule) =>
      run(() => hospitalOpsService.saveWeeklySchedule(schedule, actor)),
    createException: (
      input: {
        departmentId: string;
        opdId?: string;
        doctorId?: string;
        date: string;
        type: ScheduleExceptionType;
        reason: string;
      },
      hospitalId: string
    ) => run(() => hospitalOpsService.createException(input, hospitalId, actor)),
    resolveException: (id: string) => run(() => hospitalOpsService.resolveException(id, actor)),
    saveQueueConfig: (config: DepartmentQueueConfig) =>
      run(() => hospitalOpsService.saveQueueConfig(config, actor)),
    saveTokenConfig: (config: TokenConfig) => run(() => hospitalOpsService.saveTokenConfig(config, actor)),
    saveService: (entry: HospitalServiceEntry) => run(() => hospitalOpsService.saveService(entry, actor)),
    toggleServiceStatus: (id: string) => run(() => hospitalOpsService.toggleServiceStatus(id, actor)),
  };
}

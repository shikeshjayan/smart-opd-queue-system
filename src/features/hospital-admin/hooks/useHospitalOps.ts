"use client";

import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { roleLabel } from "@/features/auth/roles";
import { hospitalOpsService } from "@/services/hospital-ops";
import { hospitalOpsServerApi } from "../api/hospital-ops.server";
import type { OpsDepartmentConfigInput } from "@/server/actions/hospital-ops";
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
  return useAsync(() => hospitalOpsServerApi.listDepartmentConfigs(hospitalId), [hospitalId]);
}

export function useQueueConfigs(hospitalId: string) {
  return useAsync(() => hospitalOpsService.listQueueConfigs(hospitalId), [hospitalId]);
}

export function useTokenConfig(hospitalId: string) {
  return useAsync(() => hospitalOpsService.getTokenConfig(hospitalId), [hospitalId]);
}

export function useServices(hospitalId: string) {
  return useAsync(() => hospitalOpsServerApi.listServices(hospitalId), [hospitalId]);
}

export function useStaffProfiles(hospitalId: string) {
  return useAsync(() => hospitalOpsService.listStaffProfiles(hospitalId), [hospitalId]);
}

export function useRoleAssignments(hospitalId: string) {
  return useAsync(() => hospitalOpsService.listRoleAssignments(hospitalId), [hospitalId]);
}

export function useOpsStaff(hospitalId: string) {
  return useAsync(() => hospitalOpsServerApi.listStaff(hospitalId), [hospitalId]);
}

export function useOpsStaffAssignments(staffId: string) {
  return useAsync(
    () => (staffId ? hospitalOpsServerApi.listAssignments(staffId) : Promise.resolve([])),
    [staffId]
  );
}

export function useOpsLeaves(hospitalId: string, status?: "pending" | "approved" | "rejected" | "cancelled") {
  return useAsync(() => hospitalOpsServerApi.listLeaves(hospitalId, status), [hospitalId, status]);
}

export function useStaffOpsMutations() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message.replace(/^Error:\s*/, "") : "Something went wrong");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
    createAssignment: (input: Parameters<typeof hospitalOpsServerApi.createAssignment>[0]) =>
      run(() => hospitalOpsServerApi.createAssignment(input)),
    endAssignment: (id: string) => run(() => hospitalOpsServerApi.endAssignment(id)),
    requestLeave: (input: { hospitalId: string; staffId?: string; fromDate: string; toDate: string; reason: string }) =>
      run(() => hospitalOpsServerApi.requestLeave(input)),
    reviewLeave: (leaveId: string, approve: boolean) =>
      run(() => hospitalOpsServerApi.reviewLeave(leaveId, approve)),
    cancelLeave: (leaveId: string) => run(() => hospitalOpsServerApi.cancelLeave(leaveId)),
  };
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
    saveDepartmentConfig: (config: OpsDepartmentConfigInput) =>
      run(() => hospitalOpsServerApi.saveDepartmentConfig(config)),
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
    saveService: (entry: HospitalServiceEntry) =>
      run(() => hospitalOpsServerApi.saveService(entry) as Promise<HospitalServiceEntry | null>),
    toggleServiceStatus: (id: string) =>
      run(() => hospitalOpsServerApi.toggleServiceStatus(id)),
  };
}

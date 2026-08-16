import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { adminMockApi } from "../api/admin.mock";
import type { AdminSettingsInput } from "@/services/admin/types";

export function useAdminDashboard(hospitalId: string) {
  return useAsync(() => adminMockApi.getDashboard(hospitalId), [hospitalId]);
}

export function useQueueOverview(hospitalId: string) {
  return useAsync(() => adminMockApi.getQueueOverview(hospitalId), [hospitalId]);
}

export function useAdminDepartments(hospitalId: string) {
  return useAsync(() => adminMockApi.listDepartments(hospitalId), [hospitalId]);
}

export function useAdminDepartmentDetail(hospitalId: string, departmentId: string) {
  return useAsync(
    () => adminMockApi.getDepartmentDetail(hospitalId, departmentId),
    [hospitalId, departmentId]
  );
}

export function useAdminOpds(hospitalId: string) {
  return useAsync(() => adminMockApi.listOpds(hospitalId), [hospitalId]);
}

export function useAdminOpdDetail(hospitalId: string, opdId: string) {
  return useAsync(
    () => adminMockApi.getOpdDetail(hospitalId, opdId),
    [hospitalId, opdId]
  );
}

export function useAdminDoctors(hospitalId: string) {
  return useAsync(() => adminMockApi.listDoctors(hospitalId), [hospitalId]);
}

export function useAdminDoctorDetail(hospitalId: string, doctorId: string) {
  return useAsync(
    () => adminMockApi.getDoctorDetail(hospitalId, doctorId),
    [hospitalId, doctorId]
  );
}

export function useAdminStaff(hospitalId: string) {
  return useAsync(() => adminMockApi.listStaff(hospitalId), [hospitalId]);
}

export function useAdminPatients(hospitalId: string) {
  return useAsync(() => adminMockApi.listPatients(hospitalId), [hospitalId]);
}

export function useAdminPatientDetail(hospitalId: string, patientId: string) {
  return useAsync(
    () => adminMockApi.getPatientDetail(hospitalId, patientId),
    [hospitalId, patientId]
  );
}

export function useAdminReports(hospitalId: string) {
  return useAsync(() => adminMockApi.getReports(hospitalId), [hospitalId]);
}

export function useAdminSettings(hospitalId: string) {
  return useAsync(() => adminMockApi.getSettings(hospitalId), [hospitalId]);
}

export function useAdminNotifications(hospitalId: string) {
  return useAsync(() => adminMockApi.listNotifications(hospitalId), [hospitalId]);
}

export function useAdminMutations() {
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
    addDepartment: (hospitalId: string, name: string) =>
      run(() => adminMockApi.addDepartment(hospitalId, name)),
    setDepartmentStatus: (id: string, status: "active" | "inactive") =>
      run(() => adminMockApi.setDepartmentStatus(id, status)),
    addDoctor: (input: {
      hospitalId: string;
      departmentId: string;
      name: string;
      speciality: string;
      phone: string;
      email: string;
    }) => run(() => adminMockApi.addDoctor(input)),
    setDoctorStatus: (id: string, status: "active" | "inactive") =>
      run(() => adminMockApi.setDoctorStatus(id, status)),
    addOpd: (input: {
      departmentId: string;
      name: string;
      startTime: string;
      endTime: string;
    }) => run(() => adminMockApi.addOpd(input)),
    setOpdStatus: (id: string, status: "open" | "closed" | "full" | "unavailable") =>
      run(() => adminMockApi.setOpdStatus(id, status)),
    saveSettings: (hospitalId: string, input: AdminSettingsInput) =>
      run(() => adminMockApi.saveSettings(hospitalId, input)),
    markNotificationRead: (id: string) =>
      run(() => adminMockApi.markNotificationRead(id)),
    markAllNotificationsRead: (hospitalId: string) =>
      run(() => adminMockApi.markAllNotificationsRead(hospitalId)),
  };
}

import type { UserRole } from "./types/auth.types";

export const ROLE_LABELS: Record<UserRole, string> = {
  patient: "Patient",
  doctor: "Doctor",
  clinical_staff: "Clinical Staff",
  receptionist: "Receptionist",
  hospital_admin: "Hospital Admin",
  district_admin: "District Admin",
  state_admin: "State Admin",
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function roleHome(role: UserRole): string {
  const homes: Record<UserRole, string> = {
    patient: "/patient/dashboard",
    doctor: "/doctor/dashboard",
    clinical_staff: "/workspace-pending",
    receptionist: "/reception/dashboard",
    hospital_admin: "/hospital-admin/dashboard",
    district_admin: "/district-admin/dashboard",
    state_admin: "/state-admin/dashboard",
  };
  return homes[role];
}

export function workspacePrefix(role: UserRole): string {
  const prefixes: Record<UserRole, string> = {
    patient: "/patient",
    doctor: "/doctor",
    clinical_staff: "/workspace-pending",
    receptionist: "/reception",
    hospital_admin: "/hospital-admin",
    district_admin: "/district-admin",
    state_admin: "/state-admin",
  };
  return prefixes[role];
}

export function destinationFor(role: UserRole, next?: string | null): string {
  const target = next && next.startsWith(workspacePrefix(role)) ? next : roleHome(role);
  return target.startsWith("/") ? target : `/${target}`;
}

export function isStaffRole(role: UserRole): boolean {
  return role !== "patient";
}
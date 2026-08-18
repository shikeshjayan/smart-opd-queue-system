import type { UserRole } from "./types/auth.types";

export type Permission =
  | "VIEW_OWN_PROFILE"
  | "VIEW_OWN_MEDICAL_HISTORY"
  | "VIEW_PATIENT"
  | "VIEW_MEDICAL_HISTORY"
  | "CREATE_ENCOUNTER"
  | "EDIT_ENCOUNTER"
  | "COMPLETE_ENCOUNTER"
  | "VIEW_QUEUE"
  | "CALL_PATIENT"
  | "MANAGE_OPD"
  | "MANAGE_DOCTOR"
  | "MANAGE_STAFF"
  | "MANAGE_HOSPITAL"
  | "VIEW_REPORTS"
  | "VIEW_DISTRICT_DATA"
  | "VIEW_STATE_DATA"
  | "EXPORT_REPORTS";

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  patient: ["VIEW_OWN_PROFILE", "VIEW_OWN_MEDICAL_HISTORY", "VIEW_QUEUE"],
  doctor: [
    "VIEW_OWN_PROFILE",
    "VIEW_PATIENT",
    "VIEW_MEDICAL_HISTORY",
    "VIEW_QUEUE",
    "CALL_PATIENT",
    "CREATE_ENCOUNTER",
    "EDIT_ENCOUNTER",
    "COMPLETE_ENCOUNTER",
  ],
  clinical_staff: ["VIEW_OWN_PROFILE", "VIEW_QUEUE", "CALL_PATIENT"],
  receptionist: ["VIEW_OWN_PROFILE", "VIEW_PATIENT", "VIEW_QUEUE", "CALL_PATIENT"],
  hospital_admin: [
    "VIEW_OWN_PROFILE",
    "VIEW_PATIENT",
    "VIEW_QUEUE",
    "CALL_PATIENT",
    "MANAGE_OPD",
    "MANAGE_DOCTOR",
    "MANAGE_STAFF",
    "MANAGE_HOSPITAL",
    "VIEW_REPORTS",
  ],
  district_admin: [
    "VIEW_OWN_PROFILE",
    "VIEW_QUEUE",
    "VIEW_REPORTS",
    "VIEW_DISTRICT_DATA",
    "EXPORT_REPORTS",
  ],
  state_admin: [
    "VIEW_OWN_PROFILE",
    "VIEW_QUEUE",
    "VIEW_REPORTS",
    "VIEW_DISTRICT_DATA",
    "VIEW_STATE_DATA",
    "EXPORT_REPORTS",
  ],
};

export function roleHasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
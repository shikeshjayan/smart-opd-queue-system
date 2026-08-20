import type { UserRole } from "./types/auth.types";

export type Permission =
  | "VIEW_OWN_PROFILE"
  | "VIEW_OWN_MEDICAL_HISTORY"
  | "VIEW_PATIENT"
  | "VIEW_MEDICAL_HISTORY"
  | "CREATE_ENCOUNTER"
  | "EDIT_ENCOUNTER"
  | "COMPLETE_ENCOUNTER"
  | "PRESCRIBE_MEDICATION"
  | "REQUEST_CORRECTION"
  | "VIEW_PHARMACY_QUEUE"
  | "VIEW_QUEUE"
  | "CALL_PATIENT"
  | "MANAGE_OPD"
  | "MANAGE_DOCTOR"
  | "MANAGE_STAFF"
  | "MANAGE_HOSPITAL"
  | "VIEW_REPORTS"
  | "VIEW_DISTRICT_DATA"
  | "VIEW_STATE_DATA"
  | "EXPORT_REPORTS"
  | "ASSESS_PRIORITY"
  | "REQUEST_OVERRIDE"
  | "APPROVE_OVERRIDE"
  | "VIEW_PRIORITY_AUDIT"
  | "REQUEST_ASSISTANCE"
  | "MANAGE_ASSISTANCE";

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  patient: ["VIEW_OWN_PROFILE", "VIEW_OWN_MEDICAL_HISTORY", "VIEW_QUEUE", "REQUEST_ASSISTANCE"],
  doctor: [
    "VIEW_OWN_PROFILE",
    "VIEW_PATIENT",
    "VIEW_MEDICAL_HISTORY",
    "VIEW_QUEUE",
    "CALL_PATIENT",
    "CREATE_ENCOUNTER",
    "EDIT_ENCOUNTER",
    "COMPLETE_ENCOUNTER",
    "PRESCRIBE_MEDICATION",
    "REQUEST_CORRECTION",
    "VIEW_PHARMACY_QUEUE",
  ],
  clinical_staff: [
    "VIEW_OWN_PROFILE",
    "VIEW_PATIENT",
    "VIEW_QUEUE",
    "CALL_PATIENT",
    "ASSESS_PRIORITY",
    "REQUEST_OVERRIDE",
    "MANAGE_ASSISTANCE",
  ],
  receptionist: [
    "VIEW_OWN_PROFILE",
    "VIEW_PATIENT",
    "VIEW_QUEUE",
    "CALL_PATIENT",
    "REQUEST_OVERRIDE",
  ],
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
    "VIEW_PHARMACY_QUEUE",
    "ASSESS_PRIORITY",
    "REQUEST_OVERRIDE",
    "APPROVE_OVERRIDE",
    "VIEW_PRIORITY_AUDIT",
    "MANAGE_ASSISTANCE",
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
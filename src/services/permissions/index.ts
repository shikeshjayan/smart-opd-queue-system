import type { Role } from "@/services/auth/types";
import type { Permission } from "./types";

export type { Permission } from "./types";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  "state-admin": [
    "VIEW_STATE_ANALYTICS",
    "VIEW_DISTRICT_HOSPITALS",
    "VIEW_ALL_HOSPITALS",
    "VIEW_QUEUE_ALERTS",
    "VIEW_REPORTS",
    "VIEW_PATIENT",
  ],
  "district-admin": [
    "VIEW_DISTRICT_HOSPITALS",
    "VIEW_QUEUE_ALERTS",
    "VIEW_REPORTS",
    "VIEW_PATIENT",
  ],
  "hospital-admin": [
    "VIEW_ALL_HOSPITALS",
    "VIEW_QUEUE_ALERTS",
    "VIEW_REPORTS",
    "VIEW_PATIENT",
    "MANAGE_HOSPITAL",
    "MANAGE_OPD",
    "MANAGE_DOCTOR",
  ],
  doctor: ["VIEW_PATIENT", "VIEW_CLINICAL_RECORD", "MANAGE_OPD"],
  patient: ["VIEW_PATIENT", "VIEW_CLINICAL_RECORD"],
};

export function roleHasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

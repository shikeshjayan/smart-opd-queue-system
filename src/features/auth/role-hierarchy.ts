import type { UserRole } from "@/features/auth/types/auth.types";

export const ROLE_ORDER: Record<UserRole, number> = {
  state_admin: 100,
  district_admin: 80,
  hospital_admin: 60,
  receptionist: 40,
  clinical_staff: 30,
  doctor: 20,
  lab_staff: 20,
  patient: 10,
};

export function canActOnScope(
  actorRole: UserRole,
  actorScope: { stateId?: string; districtId?: string; hospitalId?: string },
  targetScope: { stateId?: string; districtId?: string; hospitalId?: string }
): boolean {
  if (actorRole === "state_admin") return true;
  if (actorRole === "district_admin") return actorScope.districtId === targetScope.districtId;
  if (actorRole === "hospital_admin") return actorScope.hospitalId === targetScope.hospitalId;
  return false;
}

import type { SessionUser } from "@/features/auth/types/auth.types";
import { mockHospitals, mockPatients } from "@/services/data";

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; code: "ACCESS_DENIED" | "UNAUTHENTICATED"; reason: string };

export function canAccessHospital(user: SessionUser, hospitalId: string): boolean {
  if (user.role === "state_admin") return true;
  if (user.role === "district_admin") {
    const hospital = mockHospitals.find((h) => h.id === hospitalId);
    return hospital?.district === user.scope.districtId;
  }
  return user.scope.hospitalId === hospitalId;
}

export function canAccessDistrict(user: SessionUser, districtId: string): boolean {
  if (user.role === "state_admin") return true;
  if (user.role === "district_admin") return user.scope.districtId === districtId;
  const hospital = mockHospitals.find((h) => h.id === user.scope.hospitalId);
  return hospital?.district === districtId;
}

export function isOwnPatientRecord(user: SessionUser, patientId: string): boolean {
  return user.role === "patient" && user.id === patientId;
}

export type ClinicalAccessContext = {
  encounterDoctorId?: string;
};

export function assertPatientAccess(
  actor: SessionUser,
  patientId: string,
  context: ClinicalAccessContext = {}
): AccessDecision {
  if (!actor) {
    return { allowed: false, code: "UNAUTHENTICATED", reason: "Authentication required." };
  }

  if (isOwnPatientRecord(actor, patientId)) {
    return { allowed: true };
  }

  if (actor.role === "patient") {
    return {
      allowed: false,
      code: "ACCESS_DENIED",
      reason: "Patients may only access their own records.",
    };
  }

  const patient = mockPatients[patientId];
  if (!patient) {
    return { allowed: false, code: "ACCESS_DENIED", reason: "Patient not found in accessible scope." };
  }

  if (!canAccessHospital(actor, patient.registeredHospitalId)) {
    return {
      allowed: false,
      code: "ACCESS_DENIED",
      reason: "Patient record is outside your assigned hospital or district scope.",
    };
  }

  if (
    actor.role === "doctor" &&
    context.encounterDoctorId !== undefined &&
    context.encounterDoctorId !== actor.id
  ) {
    return {
      allowed: false,
      code: "ACCESS_DENIED",
      reason: "You are not the assigned clinician for this encounter.",
    };
  }

  return { allowed: true };
}

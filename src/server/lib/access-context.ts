import type { UserRole } from "@/features/auth/types/auth.types";
import type { Permission } from "@/features/auth/permissions";
import type { DistrictId } from "@/config/districts";

export type AccessContext = {
  userId: string;
  role: UserRole;
  stateId: string;
  districtIds: string[];
  hospitalIds: string[];
  departmentIds: string[];
  permissions: Permission[];

  canAccessDistrict: (districtId: string) => boolean;
  canAccessHospital: (hospitalId: string) => boolean;
  canAccessDepartment: (departmentId: string) => boolean;
  getAuthorizedHospitalIds: () => string[];
  getAuthorizedDistrictIds: () => string[];
};

export function createAccessContext(base: Omit<AccessContext, "canAccessDistrict" | "canAccessHospital" | "canAccessDepartment" | "getAuthorizedHospitalIds" | "getAuthorizedDistrictIds">): AccessContext {
  return {
    ...base,
    canAccessDistrict: (districtId: string) => base.districtIds.includes(districtId),
    canAccessHospital: (hospitalId: string) => base.hospitalIds.includes(hospitalId),
    canAccessDepartment: (departmentId: string) => base.departmentIds.includes(departmentId),
    getAuthorizedHospitalIds: () => [...base.hospitalIds],
    getAuthorizedDistrictIds: () => [...base.districtIds],
  };
}

export type ResolvedAccessContext = AccessContext;
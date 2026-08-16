import type { DistrictAdminProfile, DistrictPerformance, StateAdminProfile } from "@/types";
import type { DistrictId } from "@/config/districts";

export type DistrictAdminContextValue = {
  admin: DistrictAdminProfile | null;
  districtId: DistrictId | null;
  districtName: string;
  loading: boolean;
};

export type StateAdminContextValue = {
  admin: StateAdminProfile | null;
  loading: boolean;
};

export type { DistrictPerformance };

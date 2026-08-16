import type { DistrictId } from "@/config/districts";

export type HospitalQuery = {
  district?: DistrictId | "";
  search?: string;
};

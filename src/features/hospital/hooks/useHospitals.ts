import { useAsync } from "@/lib/use-async";
import { hospitalMockApi } from "../api/hospital.mock";
import type { HospitalQuery } from "../types/hospital.types";

export function useHospitals(query: HospitalQuery) {
  return useAsync(() => hospitalMockApi.list(query), [query.district, query.search]);
}

export function useHospital(id: string) {
  return useAsync(() => hospitalMockApi.getById(id), [id]);
}

import { hospitalService } from "@/services/hospital";
import type { Hospital } from "@/types";
import type { HospitalQuery } from "../types/hospital.types";

export const hospitalMockApi = {
  async list(query: HospitalQuery): Promise<Hospital[]> {
    const hospitals = await hospitalService.list();
    const district = query.district;
    const search = query.search?.trim().toLowerCase();

    return hospitals.filter((hospital) => {
      const matchesDistrict = !district || hospital.district === district;
      const matchesSearch =
        !search ||
        hospital.name.toLowerCase().includes(search) ||
        hospital.address.toLowerCase().includes(search);
      return matchesDistrict && matchesSearch;
    });
  },

  async getById(id: string): Promise<Hospital | undefined> {
    return hospitalService.getById(id);
  },
};

import type { Department, Hospital } from "@/types";
import { getHospital, listDepartments, mockHospitals } from "../data";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

export const hospitalService = {
  async list(): Promise<Hospital[]> {
    await delay();
    return mockHospitals;
  },

  async getById(id: string): Promise<Hospital | undefined> {
    await delay();
    return getHospital(id);
  },

  async listDepartments(hospitalId: string): Promise<Department[]> {
    await delay();
    return listDepartments(hospitalId);
  },
};

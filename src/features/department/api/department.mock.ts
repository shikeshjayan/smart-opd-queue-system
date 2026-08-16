import { hospitalService } from "@/services/hospital";
import type { Department } from "@/types";

export const departmentMockApi = {
  async listByHospital(hospitalId: string): Promise<Department[]> {
    const departments = await hospitalService.listDepartments(hospitalId);
    return departments.filter((department) => department.status === "active");
  },
};

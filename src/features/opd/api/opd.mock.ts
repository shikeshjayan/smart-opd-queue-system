import { opdService } from "@/services/opd";
import type { OPD } from "@/types";

export const opdMockApi = {
  async listByDepartment(departmentId: string): Promise<OPD[]> {
    return opdService.listByDepartment(departmentId);
  },

  async getById(id: string): Promise<OPD | undefined> {
    return opdService.getById(id);
  },
};

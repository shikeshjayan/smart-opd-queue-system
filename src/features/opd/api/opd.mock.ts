import { listOpds, getOpd } from "@/server/actions/hospitals";
import type { OPD } from "@/types";

export const opdMockApi = {
  async listByDepartment(departmentId: string): Promise<OPD[]> {
    return listOpds(departmentId);
  },

  async getById(id: string): Promise<OPD | undefined> {
    const opd = await getOpd(id);
    return opd ?? undefined;
  },
};

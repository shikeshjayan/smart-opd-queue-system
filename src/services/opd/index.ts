import type { OPD } from "@/types";
import { getOpd, listOpds } from "../data";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

export const opdService = {
  async listByDepartment(departmentId: string): Promise<OPD[]> {
    await delay();
    return listOpds(departmentId);
  },

  async getById(id: string): Promise<OPD | undefined> {
    await delay();
    return getOpd(id);
  },
};

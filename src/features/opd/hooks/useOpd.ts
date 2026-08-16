import { useAsync } from "@/lib/use-async";
import { opdMockApi } from "../api/opd.mock";

export function useOpds(departmentId: string) {
  return useAsync(() => opdMockApi.listByDepartment(departmentId), [departmentId]);
}

export function useOpd(id: string) {
  return useAsync(() => opdMockApi.getById(id), [id]);
}

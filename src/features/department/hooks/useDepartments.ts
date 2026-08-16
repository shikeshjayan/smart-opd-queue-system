import { useAsync } from "@/lib/use-async";
import { departmentMockApi } from "../api/department.mock";

export function useDepartments(hospitalId: string) {
  return useAsync(() => departmentMockApi.listByHospital(hospitalId), [hospitalId]);
}

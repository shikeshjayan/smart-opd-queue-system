import { useAsync } from "@/lib/use-async";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { patientMockApi } from "../api/patient.mock";

export function usePatientDashboard() {
  const { user } = useAuth();
  const patientId = user?.id ?? "";
  return useAsync(() => patientMockApi.getDashboard(patientId), [patientId]);
}

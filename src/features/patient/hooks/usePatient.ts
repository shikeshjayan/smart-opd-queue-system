import { DEMO_PATIENT_ID } from "@/config/app";
import { useAsync } from "@/lib/use-async";
import { patientMockApi } from "../api/patient.mock";

export function usePatientDashboard() {
  return useAsync(() => patientMockApi.getDashboard(DEMO_PATIENT_ID), []);
}

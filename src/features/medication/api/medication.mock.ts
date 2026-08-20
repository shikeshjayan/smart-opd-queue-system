import { prescriptionMockApi } from "@/features/prescription/api/prescription.mock";

export const medicationsMockApi = {
  listForPatient: (patientId: string) => prescriptionMockApi.listRegimen(patientId),
};

export { useMedications } from "../hooks/useMedications";
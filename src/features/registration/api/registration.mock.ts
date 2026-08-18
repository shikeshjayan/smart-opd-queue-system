import { registrationService } from "@/services/registration";
import type {
  NewPatientInput,
  RegistrationFilters,
  TokenCancelReason,
  TokenFilters,
} from "../types/registration.types";

export const registrationMockApi = {
  getStats: () => registrationService.getStats(),
  recentRegistrations: () => registrationService.recentRegistrations(),
  searchPatients: (query: string) => registrationService.searchPatients(query),
  getPatientById: (patientId: string) => registrationService.getPatientById(patientId),
  findPotentialDuplicates: (name: string, mobile: string) =>
    registrationService.findPotentialDuplicates(name, mobile),
  createPatient: (input: NewPatientInput) => registrationService.createPatient(input),
  listOpds: (hospitalId: string) => registrationService.listOpds(hospitalId),
  generateToken: (input: {
    patientId: string;
    patientName: string;
    opdId: string;
    registrationType: "walk_in" | "appointment";
    appointmentId?: string;
    isNewPatient: boolean;
  }) => registrationService.generateToken(input),
  cancelToken: (tokenNumber: string, reason: TokenCancelReason) =>
    registrationService.cancelToken(tokenNumber, reason),
  reissueToken: (tokenNumber: string) => registrationService.reissueToken(tokenNumber),
  listTokens: (filters: TokenFilters) => registrationService.listTokens(filters),
  listRegistrations: (filters: RegistrationFilters, page: number, pageSize: number) =>
    registrationService.listRegistrations(filters, page, pageSize),
  getPatientActivity: (patientId: string) => registrationService.getPatientActivity(patientId),
};
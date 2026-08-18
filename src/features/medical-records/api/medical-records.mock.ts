import { medicalRecordsService } from "@/services/medical-records";
import type { HistoryFilters } from "../types/medical-record.types";

export const medicalRecordsMockApi = {
  getHistory: (patientId: string) => medicalRecordsService.getHistory(patientId),
  listEncounters: (patientId: string, filters: HistoryFilters, page: number, pageSize: number) =>
    medicalRecordsService.listEncounters(patientId, filters, page, pageSize),
  getEncounterDetails: (patientId: string, encounterId: string) =>
    medicalRecordsService.getEncounterDetails(patientId, encounterId),
  listPrescriptions: (patientId: string, page: number, pageSize: number) =>
    medicalRecordsService.listPrescriptions(patientId, page, pageSize),
  getPrescription: (prescriptionId: string) => medicalRecordsService.getPrescription(prescriptionId),
  listLabReports: (patientId: string, page: number, pageSize: number) =>
    medicalRecordsService.listLabReports(patientId, page, pageSize),
  getLabReport: (reportId: string) => medicalRecordsService.getLabReport(reportId),
  listDocuments: (patientId: string) => medicalRecordsService.listDocuments(patientId),
  getProfile: (patientId: string) => medicalRecordsService.getProfile(patientId),
  getDoctorPatientView: (patientId: string) =>
    medicalRecordsService.getDoctorPatientView(patientId),
};
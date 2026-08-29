import { useAsync } from "@/lib/use-async";
import { medicalRecordsRealApi } from "../api/medical-records.api";
import type { HistoryFilters } from "../types/medical-record.types";

export function usePatientHistory(patientId: string) {
  return useAsync(() => medicalRecordsRealApi.getHistory(patientId), [patientId]);
}

export function useEncounters(
  filters: HistoryFilters,
  page: number,
  pageSize: number,
  patientId: string
) {
  return useAsync(
    () => medicalRecordsRealApi.listEncounters(patientId, filters, page, pageSize),
    [patientId, filters.keyword, filters.year, filters.hospitalId, filters.departmentId, page, pageSize]
  );
}

export function useEncounterDetail(encounterId: string, patientId: string) {
  return useAsync(() => medicalRecordsRealApi.getEncounterDetails(patientId, encounterId), [
    patientId,
    encounterId,
  ]);
}

export function usePrescriptions(patientId: string, page: number, pageSize: number) {
  return useAsync(() => medicalRecordsRealApi.listPrescriptions(patientId, page, pageSize), [
    patientId,
    page,
    pageSize,
  ]);
}

export function usePrescription(prescriptionId: string) {
  return useAsync(() => medicalRecordsRealApi.getPrescription(prescriptionId), [prescriptionId]);
}

export function useLabReports(patientId: string, page: number, pageSize: number) {
  return useAsync(() => medicalRecordsRealApi.listLabReports(patientId, page, pageSize), [
    patientId,
    page,
    pageSize,
  ]);
}

export function useLabReport(reportId: string) {
  return useAsync(() => medicalRecordsRealApi.getLabReport(reportId), [reportId]);
}

export function useDocuments(patientId: string) {
  return useAsync(() => medicalRecordsRealApi.listDocuments(patientId), [patientId]);
}

export function usePatientProfile(patientId: string) {
  return useAsync(() => medicalRecordsRealApi.getProfile(patientId), [patientId]);
}

export function useDoctorPatient(patientId: string) {
  return useAsync(() => medicalRecordsRealApi.getDoctorPatientView(patientId), [patientId]);
}

export function useDoctorEncounterDetail(patientId: string, encounterId: string) {
  return useAsync(() => medicalRecordsRealApi.getEncounterDetails(patientId, encounterId), [
    patientId,
    encounterId,
  ]);
}
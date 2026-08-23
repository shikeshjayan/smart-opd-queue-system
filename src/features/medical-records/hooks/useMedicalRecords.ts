import { useAsync } from "@/lib/use-async";
import { medicalRecordsMockApi } from "../api/medical-records.mock";
import type { HistoryFilters } from "../types/medical-record.types";

export function usePatientHistory(patientId: string) {
  return useAsync(() => medicalRecordsMockApi.getHistory(patientId), [patientId]);
}

export function useEncounters(
  filters: HistoryFilters,
  page: number,
  pageSize: number,
  patientId: string
) {
  return useAsync(
    () => medicalRecordsMockApi.listEncounters(patientId, filters, page, pageSize),
    [patientId, filters.keyword, filters.year, filters.hospitalId, filters.departmentId, page, pageSize]
  );
}

export function useEncounterDetail(encounterId: string, patientId: string) {
  return useAsync(() => medicalRecordsMockApi.getEncounterDetails(patientId, encounterId), [
    patientId,
    encounterId,
  ]);
}

export function usePrescriptions(patientId: string, page: number, pageSize: number) {
  return useAsync(() => medicalRecordsMockApi.listPrescriptions(patientId, page, pageSize), [
    patientId,
    page,
    pageSize,
  ]);
}

export function usePrescription(prescriptionId: string) {
  return useAsync(() => medicalRecordsMockApi.getPrescription(prescriptionId), [prescriptionId]);
}

export function useLabReports(patientId: string, page: number, pageSize: number) {
  return useAsync(() => medicalRecordsMockApi.listLabReports(patientId, page, pageSize), [
    patientId,
    page,
    pageSize,
  ]);
}

export function useLabReport(reportId: string) {
  return useAsync(() => medicalRecordsMockApi.getLabReport(reportId), [reportId]);
}

export function useDocuments(patientId: string) {
  return useAsync(() => medicalRecordsMockApi.listDocuments(patientId), [patientId]);
}

export function usePatientProfile(patientId: string) {
  return useAsync(() => medicalRecordsMockApi.getProfile(patientId), [patientId]);
}

export function useDoctorPatient(patientId: string) {
  return useAsync(() => medicalRecordsMockApi.getDoctorPatientView(patientId), [patientId]);
}

export function useDoctorEncounterDetail(patientId: string, encounterId: string) {
  return useAsync(() => medicalRecordsMockApi.getEncounterDetails(patientId, encounterId), [
    patientId,
    encounterId,
  ]);
}
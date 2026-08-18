import { DEMO_PATIENT_ID } from "@/config/app";
import { useAsync } from "@/lib/use-async";
import { medicalRecordsMockApi } from "../api/medical-records.mock";
import type { HistoryFilters } from "../types/medical-record.types";

export function usePatientHistory(patientId: string = DEMO_PATIENT_ID) {
  return useAsync(() => medicalRecordsMockApi.getHistory(patientId), [patientId]);
}

export function useEncounters(
  filters: HistoryFilters,
  page: number,
  pageSize: number,
  patientId: string = DEMO_PATIENT_ID
) {
  return useAsync(
    () => medicalRecordsMockApi.listEncounters(patientId, filters, page, pageSize),
    [patientId, filters.keyword, filters.year, filters.hospitalId, filters.departmentId, page, pageSize]
  );
}

export function useEncounterDetail(encounterId: string, patientId: string = DEMO_PATIENT_ID) {
  return useAsync(() => medicalRecordsMockApi.getEncounterDetails(patientId, encounterId), [
    patientId,
    encounterId,
  ]);
}

export function usePrescriptions(page: number, pageSize: number) {
  return useAsync(() => medicalRecordsMockApi.listPrescriptions(DEMO_PATIENT_ID, page, pageSize), [
    page,
    pageSize,
  ]);
}

export function usePrescription(prescriptionId: string) {
  return useAsync(() => medicalRecordsMockApi.getPrescription(prescriptionId), [prescriptionId]);
}

export function useLabReports(page: number, pageSize: number) {
  return useAsync(() => medicalRecordsMockApi.listLabReports(DEMO_PATIENT_ID, page, pageSize), [
    page,
    pageSize,
  ]);
}

export function useLabReport(reportId: string) {
  return useAsync(() => medicalRecordsMockApi.getLabReport(reportId), [reportId]);
}

export function useDocuments() {
  return useAsync(() => medicalRecordsMockApi.listDocuments(DEMO_PATIENT_ID), []);
}

export function usePatientProfile() {
  return useAsync(() => medicalRecordsMockApi.getProfile(DEMO_PATIENT_ID), []);
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
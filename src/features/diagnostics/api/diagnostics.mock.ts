import { diagnosticsService } from "@/services/diagnostics";
import type {
  DiagnosticOrderContextRef,
  DiagnosticOrderItem,
  ResultValue,
} from "@/services/diagnostics/types";

export const diagnosticsMockApi = {
  searchTests: (query: string, category?: "laboratory" | "imaging" | "other") =>
    diagnosticsService.searchTests(query, category),
  listTests: () => diagnosticsService.listTests(),
  listForEncounter: (encounterId: string) => diagnosticsService.listForEncounter(encounterId),
  listForPatient: (patientId: string) => diagnosticsService.listForPatient(patientId),
  listAll: () => diagnosticsService.listAll(),
  getOrder: (orderId: string) => diagnosticsService.getOrder(orderId),
  createDraft: (
    encounterId: string,
    ref: DiagnosticOrderContextRef,
    items: DiagnosticOrderItem[],
    clinicalNotes?: string
  ) => diagnosticsService.createDraft(encounterId, ref, items, clinicalNotes),
  updateDraft: (orderId: string, items: DiagnosticOrderItem[], clinicalNotes?: string) =>
    diagnosticsService.updateDraft(orderId, items, clinicalNotes),
  submitOrder: (orderId: string) => diagnosticsService.submitOrder(orderId),
  cancelOrder: (orderId: string, reason?: string) => diagnosticsService.cancelOrder(orderId, reason),
  getSpecimenForOrder: (orderId: string) => diagnosticsService.getSpecimenForOrder(orderId),
  collectSpecimen: (orderId: string, type: string) =>
    diagnosticsService.collectSpecimen(orderId, type),
  rejectSpecimen: (orderId: string, reason: string) =>
    diagnosticsService.rejectSpecimen(orderId, reason),
  startProcessing: (orderId: string) => diagnosticsService.startProcessing(orderId),
  listResultsForOrder: (orderId: string) => diagnosticsService.listResultsForOrder(orderId),
  getResult: (resultId: string) => diagnosticsService.getResult(resultId),
  saveResultDraft: (orderId: string, testId: string, values: ResultValue[], notes?: string) =>
    diagnosticsService.saveResultDraft(orderId, testId, values, notes),
  finalizeResult: (resultId: string) => diagnosticsService.finalizeResult(resultId),
  amendResult: (orderId: string, testId: string) => diagnosticsService.amendResult(orderId, testId),
  cancelResult: (resultId: string, reason?: string) =>
    diagnosticsService.cancelResult(resultId, reason),
  markReviewed: (resultId: string, reviewerId: string) =>
    diagnosticsService.markReviewed(resultId, reviewerId),
  listDoctorResults: (doctorId: string) => diagnosticsService.listDoctorResults(doctorId),
  listPatientTests: (patientId: string) => diagnosticsService.listPatientTests(patientId),
};
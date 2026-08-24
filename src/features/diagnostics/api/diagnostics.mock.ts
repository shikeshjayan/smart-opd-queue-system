import {
  searchTests,
  listTests,
  listForPatient,
  listAll,
  getOrder,
  getSpecimenForOrder,
  createDraft,
  updateDraft,
  submitOrder,
  cancelOrder,
  collectSpecimen,
  rejectSpecimen,
  startProcessing,
  listResultsForOrder,
  getResult,
  saveResultDraft,
  finalizeDiagnosticResult,
  amendDiagnosticResult,
  cancelResult,
  markReviewed,
  listDoctorResults,
  listPatientTests,
} from "@/server/actions/diagnostics";
import type {
  DiagnosticCategory,
  DiagnosticOrder,
  DiagnosticOrderContextRef,
  DiagnosticOrderItem,
  DiagnosticResult,
  PatientTestEntry,
  ResultValue,
  Specimen,
  TestCatalogItem,
} from "@/services/diagnostics/types";

export const diagnosticsMockApi = {
  /* catalog */
  searchTests: (query: string, category?: DiagnosticCategory): Promise<TestCatalogItem[]> =>
    searchTests(query, category),
  listTests: (): Promise<TestCatalogItem[]> => listTests(),

  /* orders */
  listForEncounter: (encounterId: string): Promise<DiagnosticOrder[]> =>
    import("@/server/actions/diagnostics").then((m) => m.listDiagnosticsForEncounter(encounterId)),
  listForPatient: (patientId: string): Promise<DiagnosticOrder[]> => listForPatient(patientId),
  listAll: (): Promise<DiagnosticOrder[]> => listAll(),
  getOrder: async (orderId: string): Promise<DiagnosticOrder | undefined> =>
    (await getOrder(orderId)) ?? undefined,

  createDraft: (
    encounterId: string,
    ref: DiagnosticOrderContextRef,
    items: DiagnosticOrderItem[],
    clinicalNotes?: string
  ): Promise<DiagnosticOrder> => createDraft(encounterId, ref, items, clinicalNotes),

  updateDraft: async (
    orderId: string,
    items: DiagnosticOrderItem[],
    clinicalNotes?: string
  ): Promise<DiagnosticOrder | undefined> => (await updateDraft(orderId, items, clinicalNotes)) ?? undefined,

  submitOrder: async (orderId: string): Promise<DiagnosticOrder | undefined> =>
    (await submitOrder(orderId)) ?? undefined,

  cancelOrder: async (orderId: string, reason?: string): Promise<DiagnosticOrder | undefined> =>
    (await cancelOrder(orderId, reason)) ?? undefined,

  /* specimens */
  getSpecimenForOrder: async (orderId: string): Promise<Specimen | undefined> =>
    (await getSpecimenForOrder(orderId)) ?? undefined,

  collectSpecimen: async (orderId: string, type: string): Promise<Specimen | undefined> =>
    (await collectSpecimen(orderId, type)) ?? undefined,

  rejectSpecimen: async (orderId: string, reason: string): Promise<Specimen | undefined> =>
    (await rejectSpecimen(orderId, reason)) ?? undefined,

  startProcessing: async (orderId: string): Promise<Specimen | undefined> =>
    (await startProcessing(orderId)) ?? undefined,

  /* results */
  listResultsForOrder: (orderId: string): Promise<DiagnosticResult[]> =>
    listResultsForOrder(orderId),

  getResult: async (resultId: string): Promise<DiagnosticResult | undefined> =>
    (await getResult(resultId)) ?? undefined,

  saveResultDraft: async (
    orderId: string,
    testId: string,
    values: ResultValue[],
    notes?: string
  ): Promise<DiagnosticResult | undefined> =>
    (await saveResultDraft(orderId, testId, values, notes)) ?? undefined,

  finalizeResult: (resultId: string): Promise<DiagnosticResult | null> =>
    finalizeDiagnosticResult(resultId),

  amendResult: (orderId: string, testId: string): Promise<DiagnosticResult | null> =>
    amendDiagnosticResult(orderId, testId),

  cancelResult: async (resultId: string, reason?: string): Promise<DiagnosticResult | undefined> =>
    (await cancelResult(resultId, reason)) ?? undefined,

  markReviewed: async (
    resultId: string,
    reviewerId: string
  ): Promise<DiagnosticResult | undefined> => (await markReviewed(resultId, reviewerId)) ?? undefined,

  /* joined views */
  listDoctorResults: (
    doctorId: string
  ): Promise<Array<{ order: DiagnosticOrder; result: DiagnosticResult; patientName: string }>> =>
    listDoctorResults(doctorId),

  listPatientTests: (patientId: string): Promise<PatientTestEntry[]> => listPatientTests(patientId),
};

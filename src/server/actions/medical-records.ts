"use server";

import "server-only";
import { getSession } from "@/lib/auth";
import { resolveAccessContext } from "@/server/lib/resolve-access-context";
import { auditRepository } from "@/server/repositories/governance.repository";
import { createOutboxEvent } from "@/server/services/outbox.service";
import { patientService, encounterService, clinicalService } from "@/server/services/medical-records/patient.service";
import { historyService, accessService } from "@/server/services/medical-records/history.service";
import { prescriptionService, labService, documentRecordService } from "@/server/services/medical-records/records.service";
import { assertPermission } from "@/server/lib/scope-access";
import type { AccessContext } from "@/server/lib/access-context";
import type { Allergy, Condition, EncounterType, VitalSigns, BreakGlassRequest, CorrectionRequest, Patient } from "@/types";

async function getAccessContext(): Promise<AccessContext> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return resolveAccessContext(session);
}

async function auditMedicalAccess(
  ctx: AccessContext,
  patientId: string,
  accessType: "VIEW" | "EXPORT" | "PRINT",
  resourceId: string,
  hospitalId: string
) {
  try {
    await auditRepository.logMedicalAccess(ctx, patientId, accessType, resourceId, hospitalId);
  } catch {
    // audit must never break the request
  }
}

/* ---------- Patient ---------- */

export async function getPatientSummary(patientId: string) {
  const ctx = await getAccessContext();
  const summary = await patientService.getSummary(patientId, ctx);
  await auditMedicalAccess(ctx, patientId, "VIEW", patientId, summary.registeredHospitalId);
  return summary;
}

export async function getPatientProfile(patientId: string) {
  const ctx = await getAccessContext();
  const profile = await patientService.getProfile(patientId, ctx);
  await auditMedicalAccess(ctx, patientId, "VIEW", patientId, profile.registeredHospitalId);
  return profile;
}

export async function searchPatients(query: string) {
  const ctx = await getAccessContext();
  assertPermission(ctx, "VIEW_MEDICAL_HISTORY");
  return patientService.search(query, ctx);
}

export async function registerPatient(input: {
  identity: Patient["identity"];
  contact: Patient["contact"];
  address?: Patient["address"];
  emergencyContact?: Patient["emergencyContact"];
  bloodGroup?: string;
}, hospitalId: string) {
  const ctx = await getAccessContext();
  assertPermission(ctx, "REGISTER_PATIENT");
  const patient = await patientService.register(input, hospitalId, ctx);
  await createOutboxEvent("Patient", patient.id, "PATIENT_REGISTERED", {
    patientId: patient.id,
    patientNumber: patient.patientNumber,
    hospitalId,
  });
  return patient;
}

export async function lookupPatientByNumber(patientNumber: string) {
  const ctx = await getAccessContext();
  assertPermission(ctx, "VIEW_MEDICAL_HISTORY");
  return patientService.lookupByPatientNumber(patientNumber, ctx);
}

/* ---------- Encounters ---------- */

export async function listPatientEncounters(patientId: string) {
  const ctx = await getAccessContext();
  return encounterService.listByPatient(patientId, ctx);
}

export async function getEncounter(encounterId: string) {
  const ctx = await getAccessContext();
  return encounterService.getById(encounterId, ctx);
}

export async function startEncounter(input: {
  patientId: string;
  hospitalId: string;
  type: EncounterType;
  departmentId?: string;
  doctorId?: string;
  departmentName?: string;
  doctorName?: string;
  hospitalName?: string;
}) {
  const ctx = await getAccessContext();
  assertPermission(ctx, "CREATE_ENCOUNTER");
  const encounter = await encounterService.start(input, input.hospitalId, ctx);
  await createOutboxEvent("Encounter", encounter.id, "ENCOUNTER_CREATED", {
    encounterId: encounter.id,
    patientId: input.patientId,
    hospitalId: input.hospitalId,
    type: input.type,
  });
  return encounter;
}

export async function completeEncounter(encounterId: string) {
  const ctx = await getAccessContext();
  const encounter = await encounterService.complete(encounterId, ctx);
  await createOutboxEvent("Encounter", encounterId, "ENCOUNTER_COMPLETED", {
    encounterId,
    patientId: encounter.patientId,
    hospitalId: encounter.hospitalId,
  });
  return encounter;
}

export async function cancelEncounter(encounterId: string) {
  const ctx = await getAccessContext();
  return encounterService.cancel(encounterId, ctx);
}

/* ---------- Clinical: allergies ---------- */

export async function listAllergies(patientId: string) {
  const ctx = await getAccessContext();
  await auditMedicalAccess(ctx, patientId, "VIEW", patientId, ctx.hospitalIds[0] ?? "");
  return clinicalService.getAllergies(patientId, ctx);
}

export async function addAllergy(patientId: string, input: { substance: string; reaction?: string; severity?: Allergy["severity"] }) {
  const ctx = await getAccessContext();
  const allergy = await clinicalService.addAllergy(patientId, input, ctx);
  await createOutboxEvent("Allergy", allergy.id, "ALLERGY_RECORDED", { patientId, allergyId: allergy.id });
  return allergy;
}

export async function updateAllergy(patientId: string, allergyId: string, patch: Partial<Allergy>) {
  const ctx = await getAccessContext();
  return clinicalService.updateAllergy(patientId, allergyId, patch, ctx);
}

export async function removeAllergy(patientId: string, allergyId: string) {
  const ctx = await getAccessContext();
  await clinicalService.removeAllergy(patientId, allergyId, ctx);
}

/* ---------- Clinical: conditions ---------- */

export async function listConditions(patientId: string) {
  const ctx = await getAccessContext();
  return clinicalService.getConditions(patientId, ctx);
}

export async function addCondition(patientId: string, input: { name: string; status?: Condition["status"]; diagnosedAt?: string }) {
  const ctx = await getAccessContext();
  const condition = await clinicalService.addCondition(patientId, input, ctx);
  await createOutboxEvent("Condition", condition.id, "CONDITION_RECORDED", { patientId, conditionId: condition.id });
  return condition;
}

export async function updateConditionStatus(patientId: string, conditionId: string, status: Condition["status"]) {
  const ctx = await getAccessContext();
  return clinicalService.updateConditionStatus(patientId, conditionId, status, ctx);
}

export async function updateCondition(patientId: string, conditionId: string, patch: Partial<Condition>) {
  const ctx = await getAccessContext();
  return clinicalService.updateCondition(patientId, conditionId, patch, ctx);
}

/* ---------- Clinical: vitals ---------- */

export async function listVitalSigns(patientId: string) {
  const ctx = await getAccessContext();
  return clinicalService.getVitalSigns(patientId, ctx);
}

export async function recordVitals(patientId: string, input: {
  encounterId?: string;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  oxygenSaturation?: number;
  heightCm?: number;
  weightKg?: number;
}) {
  const ctx = await getAccessContext();
  const vitals = await clinicalService.recordVitals(patientId, input, ctx);
  await createOutboxEvent("VitalSigns", vitals.id, "VITALS_RECORDED", { patientId, vitalSignsId: vitals.id });
  return vitals;
}

/* ---------- Prescriptions / labs / documents ---------- */

export async function listPrescriptions(patientId: string) {
  const ctx = await getAccessContext();
  return prescriptionService.listByPatient(patientId, ctx);
}

export async function listEncounterPrescriptions(encounterId: string) {
  const ctx = await getAccessContext();
  return prescriptionService.listByEncounter(encounterId, ctx);
}

export async function issuePrescription(input: {
  encounterId: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  items: Array<{ medicineName: string; dosage?: string; frequency?: string; duration?: string; route?: string; instructions?: string }>;
}) {
  const ctx = await getAccessContext();
  const prescription = await prescriptionService.issue(input.encounterId, input, ctx);
  await createOutboxEvent("Prescription", prescription.id, "PRESCRIPTION_CREATED", {
    prescriptionId: prescription.id,
    encounterId: input.encounterId,
    patientId: input.patientId,
  });
  return prescription;
}

export async function listLabOrders(patientId: string) {
  const ctx = await getAccessContext();
  return labService.listOrders(patientId, ctx);
}

export async function listLabResults(patientId: string) {
  const ctx = await getAccessContext();
  return labService.listResults(patientId, ctx);
}

export async function listDocuments(patientId: string) {
  const ctx = await getAccessContext();
  return documentRecordService.listByPatient(patientId, ctx);
}

export async function setRecordVisibility(
  kind: "document" | "result",
  id: string,
  visibility: "draft" | "final" | "reviewed" | "released" | "restricted"
) {
  const ctx = await getAccessContext();
  const result = await documentRecordService.setVisibility(kind, id, visibility, ctx);
  await createOutboxEvent(kind === "document" ? "MedicalDocument" : "DiagnosticResult", id, "RECORD_VISIBILITY_CHANGED", {
    id,
    kind,
    visibility,
  });
  return result;
}

/* ---------- History + overview ---------- */

export async function getPatientTimeline(
  patientId: string,
  filters: { dateFrom?: string; dateTo?: string; hospitalId?: string; recordType?: string; limit?: number } = {}
) {
  const ctx = await getAccessContext();
  return historyService.getTimeline(patientId, filters as any, ctx);
}

export async function getPatientOverview(patientId: string) {
  const ctx = await getAccessContext();
  const overview = await historyService.overview(patientId, ctx);
  await auditMedicalAccess(ctx, patientId, "VIEW", patientId, ctx.hospitalIds[0] ?? "");
  return overview;
}

/* ---------- Access: break-glass + corrections ---------- */

export async function requestBreakGlass(patientId: string, reason: string): Promise<BreakGlassRequest> {
  const ctx = await getAccessContext();
  assertPermission(ctx, "BREAK_GLASS_ACCESS");
  const request = await accessService.requestBreakGlass(patientId, reason, ctx);
  await createOutboxEvent("BreakGlassRequest", request.id, "BREAK_GLASS_REQUESTED", {
    requestId: request.id,
    patientId,
    requestorId: ctx.userId,
    reason,
  });
  await auditRepository.logMedicalAccess(ctx, patientId, "VIEW", request.id, ctx.hospitalIds[0] ?? "");
  return request;
}

export async function hasActiveBreakGlass(patientId: string): Promise<boolean> {
  const ctx = await getAccessContext();
  return accessService.hasBreakGlass(patientId, ctx);
}

export async function requestCorrection(
  patientId: string,
  input: {
    targetType: CorrectionRequest["targetType"];
    targetId?: string;
    requestedChanges: CorrectionRequest["requestedChanges"];
    reason?: string;
  }
): Promise<CorrectionRequest> {
  const ctx = await getAccessContext();
  const request = await accessService.requestCorrection(patientId, input, ctx);
  await createOutboxEvent("CorrectionRequest", request.id, "CORRECTION_REQUESTED", {
    requestId: request.id,
    patientId,
    targetType: input.targetType,
  });
  return request;
}

export async function listCorrectionRequests(patientId: string) {
  const ctx = await getAccessContext();
  return accessService.listCorrections(patientId, ctx);
}
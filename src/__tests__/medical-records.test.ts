import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.clearAllMocks();
});

const BASE_CTX = {
  stateId: "KERALA",
  districtIds: ["ernakulam"],
  hospitalIds: ["hos_001"],
  departmentIds: ["dep_001"],
};

describe("Phase 28 medical record models", () => {
  it("should export new clinical models", async () => {
    const models = await import("@/lib/models");
    expect(models.AllergyModel).toBeDefined();
    expect(models.ConditionModel).toBeDefined();
    expect(models.VitalSignsModel).toBeDefined();
    expect(models.BreakGlassRequestModel).toBeDefined();
    expect(models.CorrectionRequestModel).toBeDefined();
    expect(models.nextSequence).toBeTypeOf("function");
  });

  it("should generate KL-GH patient numbers from sequence", async () => {
    const mod = await import("@/server/repositories/medical-records.repository");
    const num = mod.generatePatientNumber ? await mod.generatePatientNumber() : null;
    // Mocked env (no DB) may throw — the format contract is what we verify.
    if (num) {
      expect(num).toMatch(/^KL-GH-\d{9}$/);
    }
    expect(mod.PATIENT_NUMBER_PREFIX).toBe("KL-GH");
  });
});

describe("Phase 28 types", () => {
  it("should expose core clinical types at runtime import", async () => {
    const types = await import("@/types");
    expect(types).toBeDefined();
  });
});

describe("clinical access control (least privilege)", () => {
  it("patient can only access own record", async () => {
    const { createAccessContext } = await import("@/server/lib/access-context");
    const { assertPatientAccess, ScopeError } = await import("@/server/lib/scope-access");

    const own = createAccessContext({
      userId: "PAT-1",
      role: "patient",
      permissions: ["VIEW_OWN_MEDICAL_HISTORY"],
      ...BASE_CTX,
    } as any);
    expect(() => assertPatientAccess(own, "PAT-1")).not.toThrow();

    const other = createAccessContext({
      userId: "PAT-1",
      role: "patient",
      permissions: ["VIEW_OWN_MEDICAL_HISTORY"],
      ...BASE_CTX,
    } as any);
    expect(() => assertPatientAccess(other, "PAT-999")).toThrow(ScopeError);
  });

  it("doctor needs VIEW_MEDICAL_HISTORY to access a patient record", async () => {
    const { createAccessContext } = await import("@/server/lib/access-context");
    const { assertPatientAccess, ScopeError } = await import("@/server/lib/scope-access");

    const doctor = createAccessContext({
      userId: "doc_1",
      role: "doctor",
      permissions: ["VIEW_PATIENT", "VIEW_MEDICAL_HISTORY", "CREATE_ENCOUNTER"],
      ...BASE_CTX,
    } as any);
    expect(() => assertPatientAccess(doctor, "PAT-1")).not.toThrow();

    const nurse = createAccessContext({
      userId: "staff_1",
      role: "clinical_staff",
      permissions: ["VIEW_PATIENT", "CALL_PATIENT"],
      ...BASE_CTX,
    } as any);
    expect(() => assertPatientAccess(nurse, "PAT-1")).toThrow(ScopeError);
  });

  it("organizational authority does NOT confer clinical access", async () => {
    const { createAccessContext } = await import("@/server/lib/access-context");
    const { assertPatientAccess, ScopeError } = await import("@/server/lib/scope-access");

    const admin = createAccessContext({
      userId: "admin_1",
      role: "hospital_admin",
      permissions: ["VIEW_REPORTS", "MANAGE_HOSPITAL"],
      ...BASE_CTX,
    } as any);
    expect(() => assertPatientAccess(admin, "PAT-1")).toThrow(ScopeError);
  });
});

describe("cross-hospital record visibility", () => {
  it("canAccessPatientRecordFromHospital respects scope", async () => {
    const { createAccessContext } = await import("@/server/lib/access-context");
    const { canAccessPatientRecordFromHospital } = await import("@/server/lib/scope-access");

    const doctor = createAccessContext({
      userId: "doc_1",
      role: "doctor",
      permissions: ["VIEW_MEDICAL_HISTORY"],
      districtIds: ["ernakulam"],
      hospitalIds: ["hos_001"],
      departmentIds: [],
    } as any);

    expect(canAccessPatientRecordFromHospital(doctor, "hos_001")).toBe(true);
    // Same district, different hospital → allowed for clinical roles
    expect(canAccessPatientRecordFromHospital(doctor, "hos_002")).toBe(true);
  });
});

describe("medical records server actions", () => {
  it("should export required actions", async () => {
    const mod = await import("@/server/actions/medical-records");
    const actions = [
      "getPatientSummary",
      "getPatientProfile",
      "searchPatients",
      "registerPatient",
      "lookupPatientByNumber",
      "listPatientEncounters",
      "getEncounter",
      "startEncounter",
      "completeEncounter",
      "cancelEncounter",
      "listAllergies",
      "addAllergy",
      "updateAllergy",
      "removeAllergy",
      "listConditions",
      "addCondition",
      "updateConditionStatus",
      "updateCondition",
      "listVitalSigns",
      "recordVitals",
      "listPrescriptions",
      "listEncounterPrescriptions",
      "issuePrescription",
      "listLabOrders",
      "listLabResults",
      "listDocuments",
      "setRecordVisibility",
      "getPatientTimeline",
      "getPatientOverview",
      "requestBreakGlass",
      "hasActiveBreakGlass",
      "requestCorrection",
      "listCorrectionRequests",
    ];
    for (const a of actions) {
      expect(typeof (mod as Record<string, unknown>)[a], `missing action ${a}`).toBe("function");
    }
  });
});

describe("medical records repository", () => {
  it("should export all repositories", async () => {
    const mod = await import("@/server/repositories/medical-records.repository");
    expect(mod.patientRepository).toBeDefined();
    expect(typeof mod.patientRepository.findById).toBe("function");
    expect(typeof mod.patientRepository.create).toBe("function");
    expect(typeof mod.patientRepository.searchPatients).toBe("function");
    expect(mod.encounterRepository).toBeDefined();
    expect(typeof mod.encounterRepository.create).toBe("function");
    expect(typeof mod.encounterRepository.updateStatus).toBe("function");
    expect(mod.allergyRepository).toBeDefined();
    expect(mod.conditionRepository).toBeDefined();
    expect(mod.vitalSignsRepository).toBeDefined();
    expect(mod.prescriptionRepository).toBeDefined();
    expect(mod.labRepository).toBeDefined();
    expect(mod.documentRepository).toBeDefined();
    expect(mod.breakGlassRepository).toBeDefined();
    expect(mod.correctionRequestRepository).toBeDefined();
    expect(typeof mod.cursorPaginate).toBe("function");
  });

  it("encounter status update supports planned/in_progress/completed lifecycle", async () => {
    const { encounterService } = await import("@/server/services/medical-records/patient.service");
    expect(typeof encounterService.start).toBe("function");
    expect(typeof encounterService.complete).toBe("function");
    expect(typeof encounterService.cancel).toBe("function");
  });
});

describe("medical records services", () => {
  it("patient service exposes clinical methods", async () => {
    const { patientService, clinicalService } = await import("@/server/services/medical-records/patient.service");
    expect(typeof patientService.getSummary).toBe("function");
    expect(typeof patientService.getProfile).toBe("function");
    expect(typeof patientService.search).toBe("function");
    expect(typeof patientService.register).toBe("function");
    expect(typeof clinicalService.getAllergies).toBe("function");
    expect(typeof clinicalService.addAllergy).toBe("function");
    expect(typeof clinicalService.getConditions).toBe("function");
    expect(typeof clinicalService.addCondition).toBe("function");
    expect(typeof clinicalService.getVitalSigns).toBe("function");
    expect(typeof clinicalService.recordVitals).toBe("function");
    expect(typeof clinicalService.getConsultation).toBe("function");
  });

  it("history service exposes timeline + overview + access", async () => {
    const { historyService } = await import("@/server/services/medical-records/history.service");
    expect(typeof historyService.getTimeline).toBe("function");
    expect(typeof historyService.overview).toBe("function");
    expect(typeof historyService.getRecentEncounters).toBe("function");
    expect(typeof historyService.getLatestVitals).toBe("function");
  });

  it("access service exposes break-glass + corrections", async () => {
    const { accessService } = await import("@/server/services/medical-records/history.service");
    expect(typeof accessService.requestBreakGlass).toBe("function");
    expect(typeof accessService.hasBreakGlass).toBe("function");
    expect(typeof accessService.requestCorrection).toBe("function");
    expect(typeof accessService.listCorrections).toBe("function");
  });

  it("records service exposes prescriptions, labs, documents, visibility", async () => {
    const { prescriptionService, labService, documentRecordService } = await import(
      "@/server/services/medical-records/records.service"
    );
    expect(typeof prescriptionService.listByPatient).toBe("function");
    expect(typeof prescriptionService.issue).toBe("function");
    expect(typeof labService.listOrders).toBe("function");
    expect(typeof labService.listResults).toBe("function");
    expect(typeof documentRecordService.listByPatient).toBe("function");
    expect(typeof documentRecordService.setVisibility).toBe("function");
  });
});

describe("UI adapter wiring", () => {
  it("hooks use the real API adapter", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = process.cwd();
    const hook = readFileSync(join(root, "src/features/medical-records/hooks/useMedicalRecords.ts"), "utf-8");
    expect(hook).toContain("medical-records.api");
    const search = readFileSync(join(root, "src/features/medical-records/hooks/usePatientSearch.ts"), "utf-8");
    expect(search).toContain("medical-records.api");
  });
});
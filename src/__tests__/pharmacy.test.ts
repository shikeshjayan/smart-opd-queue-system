import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.clearAllMocks();
});

const BASE_CTX = {
  stateId: "KERALA",
  districtIds: ["ernakulam"],
  hospitalIds: ["hos_001"],
  departmentIds: ["dep_001"],
  permissions: [
    "VIEW_PHARMACY_DASHBOARD",
    "VIEW_PHARMACY_QUEUE",
    "DISPENSE_MEDICATION",
    "VIEW_PHARMACY_INVENTORY",
    "MANAGE_PHARMACY_STOCK",
  ],
};

describe("Phase 29 pharmacy models", () => {
  it("should export all pharmacy models", async () => {
    const models = await import("@/lib/models");
    expect(models.MedicineModel).toBeDefined();
    expect(models.MedicineStockModel).toBeDefined();
    expect(models.StockTransactionModel).toBeDefined();
    expect(models.PharmacyAuditModel).toBeDefined();
    expect(models.InventoryConfigModel).toBeDefined();
    expect(models.DispensingModel).toBeDefined();
  });

  it("MedicineStockModel has aggregate", async () => {
    const { MedicineStockModel } = await import("@/lib/models");
    expect((MedicineStockModel as any).aggregate).toBeDefined();
  });
});

describe("Phase 29 pharmacy types", () => {
  it("fefoCompare orders soonest-expiry first", async () => {
    const { fefoCompare } = await import("@/services/pharmacy/types");
    expect(fefoCompare({ expiryDate: "2025-01-01" }, { expiryDate: "2025-12-31" })).toBeLessThan(0);
    expect(fefoCompare({ expiryDate: "2025-12-31" }, { expiryDate: "2025-01-01" })).toBeGreaterThan(0);
    expect(fefoCompare({ expiryDate: "2025-06-15" }, { expiryDate: "2025-06-15" })).toBe(0);
  });

  it("EXPIRY_ALERT_DAYS defaults to 90", async () => {
    const { EXPIRY_ALERT_DAYS } = await import("@/services/pharmacy/types");
    expect(EXPIRY_ALERT_DAYS).toBe(90);
  });
});

describe("pharmacy access control", () => {
  it("pharmacist with DISPENSE_MEDICATION can access hospital scope", async () => {
    const { createAccessContext } = await import("@/server/lib/access-context");
    const { assertHospitalAccess } = await import("@/server/lib/scope-access");

    const pharmacist = createAccessContext({
      userId: "pharm_1",
      role: "pharmacist",
      ...BASE_CTX,
    } as any);
    expect(() => assertHospitalAccess(pharmacist, "hos_001")).not.toThrow();
  });

  it("patient without pharmacy permissions cannot assert hospital access for other hospitals", async () => {
    const { createAccessContext } = await import("@/server/lib/access-context");
    const { assertHospitalAccess, ScopeError } = await import("@/server/lib/scope-access");

    const patient = createAccessContext({
      userId: "PAT-1",
      role: "patient",
      hospitalIds: ["hos_001"],
      permissions: [],
      stateId: "KERALA",
      districtIds: ["ernakulam"],
      departmentIds: [],
    } as any);
    expect(() => assertHospitalAccess(patient, "hos_002")).toThrow(ScopeError);
  });
});

describe("pharmacy repository", () => {
  it("should export pharmacy repository", async () => {
    const mod = await import("@/server/repositories/pharmacy.repository");
    expect(mod.pharmacyRepository).toBeDefined();
    expect(typeof mod.pharmacyRepository.findStockByHospital).toBe("function");
    expect(typeof mod.pharmacyRepository.createBatch).toBe("function");
    expect(typeof mod.pharmacyRepository.createTransaction).toBe("function");
    expect(typeof mod.pharmacyRepository.createDispensing).toBe("function");
    expect(typeof mod.pharmacyRepository.logAudit).toBe("function");
    expect(typeof mod.pharmacyRepository.sumStockByMedicine).toBe("function");
  });
});

describe("pharmacy services", () => {
  it("medicineService exposes list and create", async () => {
    const { medicineService } = await import("@/server/services/pharmacy/medicine.service");
    expect(typeof medicineService.list).toBe("function");
    expect(typeof medicineService.create).toBe("function");
  });

  it("inventoryService exposes batch and threshold operations", async () => {
    const { inventoryService } = await import("@/server/services/pharmacy/inventory.service");
    expect(typeof inventoryService.listBatches).toBe("function");
    expect(typeof inventoryService.receiveStock).toBe("function");
    expect(typeof inventoryService.adjustStock).toBe("function");
    expect(typeof inventoryService.setBatchStatus).toBe("function");
    expect(typeof inventoryService.getSummary).toBe("function");
    expect(typeof inventoryService.upsertThreshold).toBe("function");
  });

  it("dispensingService exposes dispensePrescription and getAvailability", async () => {
    const { dispensingService } = await import("@/server/services/pharmacy/dispensing.service");
    expect(typeof dispensingService.dispensePrescription).toBe("function");
    expect(typeof dispensingService.getAvailability).toBe("function");
  });

  it("stockAlertService exposes dashboard, lowStock, expiringSoon", async () => {
    const { stockAlertService } = await import("@/server/services/pharmacy/stock-alert.service");
    expect(typeof stockAlertService.dashboard).toBe("function");
    expect(typeof stockAlertService.lowStock).toBe("function");
    expect(typeof stockAlertService.expiringSoon).toBe("function");
  });

  it("pharmacyService facade delegates to dispensing and inventory", async () => {
    const { pharmacyService } = await import("@/server/services/pharmacy/pharmacy.service");
    expect(typeof pharmacyService.dispensePrescription).toBe("function");
    expect(typeof pharmacyService.getInventorySummary).toBe("function");
  });
});

describe("pharmacy server actions", () => {
  it("should export all pharmacy actions", async () => {
    const mod = await import("@/server/actions/pharmacy");
    const actions = [
      "getPharmacyDashboard",
      "getPharmacyQueue",
      "getLowStockAlerts",
      "getExpiringAlerts",
      "listStock",
      "getInventorySummary",
      "receiveStock",
      "adjustStock",
      "markBatchStatus",
      "upsertStockThreshold",
      "listStockThresholds",
      "listStockTransactions",
      "dispensePrescription",
      "dispatchToPharmacy",
      "getPrescriptionAvailability",
      "listDispensingHistory",
      "getPatientDispensingHistory",
      "listMedicines",
      "createMedicine",
      "getPharmacyAuditLog",
      "getPharmacyQueueStats",
    ];
    for (const a of actions) {
      expect(typeof (mod as Record<string, unknown>)[a], `missing action ${a}`).toBe("function");
    }
  });
});

describe("pharmacy UI wiring", () => {
  it("usePharmacyQueue hook uses real API adapter", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = process.cwd();
    const hook = readFileSync(join(root, "src/features/pharmacy/hooks/usePharmacyQueue.ts"), "utf-8");
    expect(hook).toContain("pharmacy.api");
    expect(hook).not.toContain("pharmacy.mock");
  });

  it("pharmacy mock file is removed", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = process.cwd();
    expect(existsSync(join(root, "src/features/pharmacy/api/pharmacy.mock.ts"))).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("access context", () => {
  it("should create access context with helper methods", async () => {
    const { createAccessContext } = await import("@/server/lib/access-context");
    const ctx = createAccessContext({
      userId: "user1",
      role: "state_admin",
      stateId: "KERALA",
      permissions: [],
      districtIds: ["ernakulam", "thiruvananthapuram"],
      hospitalIds: ["hos_001", "hos_002"],
      departmentIds: ["dept_001"],
    });

    expect(ctx.userId).toBe("user1");
    expect(ctx.role).toBe("state_admin");
    expect(ctx.canAccessDistrict("ernakulam")).toBe(true);
    expect(ctx.canAccessDistrict("kottayam")).toBe(false);
    expect(ctx.canAccessHospital("hos_001")).toBe(true);
    expect(ctx.canAccessHospital("hos_999")).toBe(false);
    expect(ctx.canAccessDepartment("dept_001")).toBe(true);
    expect(ctx.canAccessDepartment("dept_999")).toBe(false);
    expect(ctx.getAuthorizedHospitalIds()).toEqual(["hos_001", "hos_002"]);
    expect(ctx.getAuthorizedDistrictIds()).toEqual(["ernakulam", "thiruvananthapuram"]);
  });
});

describe("scope access", () => {
  it("should have scope assertion functions", async () => {
    const mod = await import("@/server/lib/scope-access");
    expect(typeof mod.assertDistrictAccess).toBe("function");
    expect(typeof mod.assertHospitalAccess).toBe("function");
    expect(typeof mod.assertAnyDistrictAccess).toBe("function");
    expect(typeof mod.buildScopeFilter).toBe("function");
  });

  it("assertDistrictAccess should throw for unauthorized district", async () => {
    const { createAccessContext } = await import("@/server/lib/access-context");
    const { assertDistrictAccess } = await import("@/server/lib/scope-access");
    const ctx = createAccessContext({
      userId: "user1",
      role: "district_admin",
      stateId: "KERALA",
      permissions: [],
      districtIds: ["ernakulam"],
      hospitalIds: [],
      departmentIds: [],
    });

    expect(() => assertDistrictAccess(ctx, "ernakulam")).not.toThrow();
    expect(() => assertDistrictAccess(ctx, "kottayam")).toThrow();
  });

  it("assertHospitalAccess should throw for unauthorized hospital", async () => {
    const { createAccessContext } = await import("@/server/lib/access-context");
    const { assertHospitalAccess } = await import("@/server/lib/scope-access");
    const ctx = createAccessContext({
      userId: "user1",
      role: "hospital_admin",
      stateId: "KERALA",
      permissions: [],
      districtIds: ["ernakulam"],
      hospitalIds: ["hos_001"],
      departmentIds: [],
    });

    expect(() => assertHospitalAccess(ctx, "hos_001")).not.toThrow();
    expect(() => assertHospitalAccess(ctx, "hos_999")).toThrow();
  });

  it("buildScopeFilter should return correct filter", async () => {
    const { createAccessContext } = await import("@/server/lib/access-context");
    const { buildScopeFilter } = await import("@/server/lib/scope-access");
    const ctx = createAccessContext({
      userId: "user1",
      role: "state_admin",
      stateId: "KERALA",
      permissions: [],
      districtIds: ["ernakulam", "thiruvananthapuram"],
      hospitalIds: ["hos_001", "hos_002"],
      departmentIds: [],
    });

    const filter = buildScopeFilter(ctx, "hospital");
    expect(filter).toEqual({ _id: { $in: ["hos_001", "hos_002"] } });
  });
});

describe("permissions", () => {
  it("should have getPermissionsForRole function", async () => {
    const { getPermissionsForRole } = await import("@/features/auth/permissions");
    expect(typeof getPermissionsForRole).toBe("function");

    const perms = getPermissionsForRole("state_admin");
    expect(Array.isArray(perms)).toBe(true);
  });
});

describe("outbox service", () => {
  it("should export outbox functions", async () => {
    const mod = await import("@/server/services/outbox.service");
    expect(typeof mod.createOutboxEvent).toBe("function");
    expect(typeof mod.getPendingEvents).toBe("function");
    expect(typeof mod.markEventProcessing).toBe("function");
    expect(typeof mod.markEventCompleted).toBe("function");
    expect(typeof mod.markEventFailed).toBe("function");
  });
});

describe("analytics worker", () => {
  it("should export worker functions", async () => {
    const mod = await import("@/server/workers/analytics.worker");
    expect(typeof mod.processOutboxEvents).toBe("function");
  });
});

describe("governance services", () => {
  it("state service should be instantiable", async () => {
    const { stateService } = await import("@/server/services/governance/state.service");
    expect(stateService).toBeDefined();
    expect(typeof stateService.getStats).toBe("function");
    expect(typeof stateService.getAnalytics).toBe("function");
    expect(typeof stateService.getDistrictComparison).toBe("function");
    expect(typeof stateService.listHospitalDirectory).toBe("function");
    expect(typeof stateService.listAnnouncements).toBe("function");
    expect(typeof stateService.publishAnnouncement).toBe("function");
    expect(typeof stateService.getUsers).toBe("function");
    expect(typeof stateService.getAuditLog).toBe("function");
    expect(typeof stateService.getAlertsSummary).toBe("function");
    expect(typeof stateService.getServiceAvailability).toBe("function");
    expect(typeof stateService.getCapacityByDistrict).toBe("function");
    expect(typeof stateService.getSystemHealth).toBe("function");
  });

  it("district service should be instantiable", async () => {
    const { districtService } = await import("@/server/services/governance/district.service");
    expect(districtService).toBeDefined();
    expect(typeof districtService.getDashboard).toBe("function");
    expect(typeof districtService.getAnalytics).toBe("function");
    expect(typeof districtService.listHospitalRows).toBe("function");
    expect(typeof districtService.getComparison).toBe("function");
    expect(typeof districtService.getCapacity).toBe("function");
    expect(typeof districtService.getResources).toBe("function");
    expect(typeof districtService.getServiceMatrix).toBe("function");
    expect(typeof districtService.listAnnouncements).toBe("function");
    expect(typeof districtService.publishAnnouncement).toBe("function");
    expect(typeof districtService.listAudit).toBe("function");
    expect(typeof districtService.getSettings).toBe("function");
  });

  it("hospital service should be instantiable", async () => {
    const { hospitalService } = await import("@/server/services/governance/hospital.service");
    expect(hospitalService).toBeDefined();
    expect(typeof hospitalService.getDashboard).toBe("function");
    expect(typeof hospitalService.getCapacity).toBe("function");
    expect(typeof hospitalService.getQueueStatus).toBe("function");
    expect(typeof hospitalService.getDepartments).toBe("function");
    expect(typeof hospitalService.getDoctors).toBe("function");
  });

  it("alerts service should be instantiable", async () => {
    const { alertsService } = await import("@/server/services/governance/alerts.service");
    expect(alertsService).toBeDefined();
    expect(typeof alertsService.createAlert).toBe("function");
    expect(typeof alertsService.getActiveAlerts).toBe("function");
    expect(typeof alertsService.getStatewideAlerts).toBe("function");
    expect(typeof alertsService.acknowledgeAlert).toBe("function");
    expect(typeof alertsService.resolveAlert).toBe("function");
    expect(typeof alertsService.checkThresholds).toBe("function");
  });
});

describe("governance repositories", () => {
  it("should export all repositories", async () => {
    const govRepo = await import("@/server/repositories/governance.repository");
    expect(typeof govRepo.analyticsRepository).toBe("object");
    expect(typeof govRepo.capacityRepository).toBe("object");
    expect(typeof govRepo.alertRepository).toBe("object");
    expect(typeof govRepo.auditRepository).toBe("object");

    const hospRepo = await import("@/server/repositories/hospital.repository");
    expect(typeof hospRepo.hospitalRepository).toBe("object");
    expect(typeof hospRepo.districtRepository).toBe("object");
  });
});

describe("types completeness", () => {
  it("should import governance types from @/types", async () => {
    const types = await import("@/types");
    // Types are compile-time only; just verify the module loads
    expect(types).toBeDefined();
  });

  it("should import district types", async () => {
    const types = await import("@/services/district/types");
    expect(types).toBeDefined();
    expect(typeof types.DEFAULT_DISTRICT_FILTERS).toBe("object");
  });

  it("should import state types", async () => {
    const types = await import("@/services/state/types");
    expect(types).toBeDefined();
  });
});

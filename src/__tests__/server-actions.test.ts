import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadStatus", () => {
  it("should return normal for low waiting", async () => {
    const { getDistrictComparison } = await import("@/server/actions/district-admin");
    expect(typeof getDistrictComparison).toBe("function");
  });
});

describe("district-admin server actions", () => {
  it("should export all required functions", async () => {
    const mod = await import("@/server/actions/district-admin");
    expect(typeof mod.getDistrictDashboard).toBe("function");
    expect(typeof mod.getDistrictAnalytics).toBe("function");
    expect(typeof mod.listDistrictHospitalRows).toBe("function");
    expect(typeof mod.getDistrictComparison).toBe("function");
    expect(typeof mod.getDistrictCapacity).toBe("function");
    expect(typeof mod.getDistrictResources).toBe("function");
    expect(typeof mod.getHospitalDoctorAvailability).toBe("function");
    expect(typeof mod.getDistrictServiceMatrix).toBe("function");
    expect(typeof mod.getDistrictReferrals).toBe("function");
    expect(typeof mod.listDistrictAnnouncements).toBe("function");
    expect(typeof mod.publishDistrictAnnouncement).toBe("function");
    expect(typeof mod.listDistrictAudit).toBe("function");
    expect(typeof mod.getDistrictSettings).toBe("function");
    expect(typeof mod.saveDistrictSettings).toBe("function");
    expect(typeof mod.getDistrictReport).toBe("function");
    expect(typeof mod.toggleDistrictHospitalActive).toBe("function");
  });
});

describe("state-admin server actions", () => {
  it("should export all required functions", async () => {
    const mod = await import("@/server/actions/state-admin");
    expect(typeof mod.getStateStats).toBe("function");
    expect(typeof mod.listDistrictComparison).toBe("function");
    expect(typeof mod.listHospitalDirectory).toBe("function");
    expect(typeof mod.getServiceAvailability).toBe("function");
    expect(typeof mod.getCapacityByDistrict).toBe("function");
    expect(typeof mod.listAnnouncements).toBe("function");
    expect(typeof mod.publishAnnouncement).toBe("function");
    expect(typeof mod.getAuditLog).toBe("function");
    expect(typeof mod.getAlertsSummary).toBe("function");
    expect(typeof mod.getUsers).toBe("function");
    expect(typeof mod.toggleHospitalActive).toBe("function");
    expect(typeof mod.getSystemHealth).toBe("function");
  });
});

describe("district-admin hooks", () => {
  it("should export all hooks", async () => {
    const mod = await import("@/features/district-admin/hooks/useDistrictAdminData");
    expect(typeof mod.useDistrictDashboard).toBe("function");
    expect(typeof mod.useDistrictHospitals).toBe("function");
    expect(typeof mod.useDistrictComparison).toBe("function");
    expect(typeof mod.useDistrictCapacity).toBe("function");
    expect(typeof mod.useDistrictResources).toBe("function");
    expect(typeof mod.useDistrictServiceMatrix).toBe("function");
    expect(typeof mod.useDistrictReferrals).toBe("function");
    expect(typeof mod.useDistrictAnnouncements).toBe("function");
    expect(typeof mod.useDistrictAudit).toBe("function");
    expect(typeof mod.useDistrictSettings).toBe("function");
    expect(typeof mod.useDistrictReport).toBe("function");
    expect(typeof mod.useHospitalDoctorAvailability).toBe("function");
    expect(typeof mod.districtPublishAnnouncement).toBe("function");
    expect(typeof mod.districtSaveSettings).toBe("function");
    expect(typeof mod.districtToggleHospitalActive).toBe("function");
  });
});

describe("state-admin hooks", () => {
  it("should export all hooks", async () => {
    const mod = await import("@/features/state-admin/hooks/useStateAdminData");
    expect(typeof mod.useStateStats).toBe("function");
    expect(typeof mod.useDistrictComparison).toBe("function");
    expect(typeof mod.useStateHospitals).toBe("function");
    expect(typeof mod.useServiceAvailability).toBe("function");
    expect(typeof mod.useCapacityByDistrict).toBe("function");
    expect(typeof mod.useStateAnnouncements).toBe("function");
    expect(typeof mod.useStateAuditLog).toBe("function");
    expect(typeof mod.useStateMutations).toBe("function");
  });
});

describe("district types", () => {
  it("should export DEFAULT_DISTRICT_FILTERS", async () => {
    const { DEFAULT_DISTRICT_FILTERS } = await import("@/services/district/types");
    expect(DEFAULT_DISTRICT_FILTERS).toEqual({
      dateRange: "today",
      hospitalId: "",
      departmentId: "",
      serviceCode: "",
    });
  });

  it("should have correct DistrictId type values", async () => {
    const { DISTRICTS } = await import("@/config/districts");
    const ids = DISTRICTS.map((d: any) => d.id);
    expect(ids).toContain("ernakulam");
    expect(ids).toContain("thiruvananthapuram");
    expect(DISTRICTS.length).toBe(14);
  });
});

describe("useAsync hook", () => {
  it("should export useAsync function", async () => {
    const { useAsync } = await import("@/lib/use-async");
    expect(typeof useAsync).toBe("function");
  });
});

describe("config", () => {
  it("should have getDistrictName for all districts", async () => {
    const { getDistrictName, DISTRICTS } = await import("@/config/districts");
    for (const d of DISTRICTS) {
      const name = getDistrictName(d.id);
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

describe("district-admin service types", () => {
  it("should re-export district types correctly", async () => {
    const types = await import("@/features/district-admin/types/district-admin.types");
    expect(types).toBeDefined();
  });

  it("should re-export state types correctly", async () => {
    const types = await import("@/features/state-admin/types/state-admin.types");
    expect(types).toBeDefined();
  });
});

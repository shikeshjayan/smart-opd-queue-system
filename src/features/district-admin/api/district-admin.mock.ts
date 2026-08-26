import type {
  Announcement,
  ComparisonRow,
  CapacityRow,
  DistrictFilters,
  DistrictHospitalRow,
  DistrictReportType,
  DoctorAvailabilityRow,
  ServiceAvailabilityRow,
  OpdAnalyticsData,
  ReferralFlow,
  ResourceSummaryRow,
  DistrictAuditEvent,
  DistrictSettings,
  DistrictStats,
} from "../types/district-admin.types";
import { districtAdminService } from "@/services/district";
import type { AuditActor } from "@/services/hospital-ops/types";
import type { DistrictId } from "@/config/districts";
import type { GovernmentAlert } from "@/types";

type HospitalLoadStatus = "normal" | "high_load" | "alert";

function loadToHealth(status: HospitalLoadStatus): "healthy" | "warning" | "critical" {
  if (status === "alert") return "critical";
  if (status === "high_load") return "warning";
  return "healthy";
}

export const districtAdminMockApi = {
  async getDashboard(districtId: DistrictId, filters: DistrictFilters): Promise<{
    performance: DistrictStats;
    hospitals: Array<{
      hospital: { id: string; name: string };
      waiting: number;
      health: "healthy" | "warning" | "critical";
      activeOpds: number;
    }>;
    alerts: GovernmentAlert[];
    longestQueue: { hospitalName: string; departmentName: string; waiting: number } | null;
    announcements: Announcement[];
  }> {
    const [performance, hospitalRows, alerts, announcements] = await Promise.all([
      districtAdminService.getStats(districtId, filters),
      districtAdminService.getHospitalRows(districtId, filters),
      districtAdminService.getAlerts(districtId),
      districtAdminService.listAnnouncements(districtId),
    ]);

    const hospitals = hospitalRows.map((row) => ({
      hospital: { id: row.hospitalId, name: row.name },
      waiting: row.waiting,
      health: loadToHealth(row.status),
      activeOpds: row.activeOpds,
    }));

    const longestRow = hospitalRows.reduce(
      (max, r) => (r.waiting > (max?.waiting ?? 0) ? r : max),
      hospitalRows[0] as DistrictHospitalRow | undefined
    );
    const longestQueue = longestRow
      ? { hospitalName: longestRow.name, departmentName: "", waiting: longestRow.waiting }
      : null;

    return { performance, hospitals, alerts, longestQueue, announcements };
  },

  async getAnalytics(
    districtId: DistrictId,
    period: "today" | "week" | "month",
    filters: DistrictFilters
  ): Promise<OpdAnalyticsData> {
    const opdPeriod = period === "week" ? "weekly" : period === "month" ? "monthly" : "today";
    return districtAdminService.getOpdAnalytics(districtId, opdPeriod, filters);
  },

  async listHospitalRows(districtId: DistrictId): Promise<DistrictHospitalRow[]> {
    return districtAdminService.getHospitalRows(districtId);
  },

  async getComparison(districtId: DistrictId): Promise<ComparisonRow[]> {
    return districtAdminService.getComparison(districtId);
  },

  async getCapacity(districtId: DistrictId): Promise<CapacityRow[]> {
    return districtAdminService.getCapacity(districtId);
  },

  async getResources(districtId: DistrictId): Promise<ResourceSummaryRow[]> {
    return districtAdminService.getResourceSummary(districtId);
  },

  async getDoctorAvailability(
    hospitalId: string,
    departmentId?: string
  ): Promise<DoctorAvailabilityRow[]> {
    return districtAdminService.getDoctorAvailability(hospitalId, departmentId);
  },

  async getServiceMatrix(districtId: DistrictId): Promise<{
    hospitals: Array<{ id: string; name: string }>;
    rows: ServiceAvailabilityRow[];
  }> {
    return districtAdminService.getServiceMatrix(districtId);
  },

  async getReferrals(districtId: DistrictId): Promise<ReferralFlow[]> {
    return districtAdminService.getReferrals(districtId);
  },

  async listAnnouncements(districtId: DistrictId): Promise<Announcement[]> {
    return districtAdminService.listAnnouncements(districtId);
  },

  async publishAnnouncement(
    input: { title: string; message: string; audience: string; targetIds: string[] },
    actor: AuditActor
  ): Promise<Announcement> {
    const result = await districtAdminService.publishAnnouncement(
      { title: input.title, message: input.message, audience: input.audience as any, targetIds: input.targetIds },
      actor
    );
    return result!;
  },

  async listAudit(
    districtId: DistrictId,
    filters: { action?: string; query?: string }
  ): Promise<DistrictAuditEvent[]> {
    return districtAdminService.listAudit(districtId, filters as { action?: any; query?: string });
  },

  async getSettings(districtId: DistrictId): Promise<DistrictSettings> {
    return districtAdminService.getSettings(districtId);
  },

  async saveSettings(
    districtId: DistrictId,
    settings: DistrictSettings,
    actor: AuditActor
  ): Promise<DistrictSettings> {
    const result = await districtAdminService.saveSettings(settings, actor);
    return result!;
  },

  async getReport(
    districtId: DistrictId,
    type: DistrictReportType,
    filters: DistrictFilters = { dateRange: "today", hospitalId: "", departmentId: "", serviceCode: "" }
  ): Promise<{
    type: DistrictReportType;
    title: string;
    period: string;
    summary: Array<{ label: string; value: string | number }>;
    table: { columns: string[]; rows: Array<Array<string | number>> };
  }> {
    return districtAdminService.getReport(districtId, type, filters);
  },
};

import type {
  Announcement,
  ComparisonRow,
  DistrictFilters,
  DistrictHospitalRow,
  DistrictReportType,
  DoctorAvailabilityRow,
  HospitalLoadStatus,
  OpdAnalyticsData,
  ReferralFlow,
  ResourceSummaryRow,
  ServiceMatrixRow,
  DistrictAuditEvent,
  DistrictSettings,
} from "../types/district-admin.types";
import { districtAdminService } from "@/services/district";
import type { AuditActor } from "@/services/hospital-ops/types";
import type { DistrictId } from "@/config/districts";

export const districtAdminMockApi = {
  async getDashboard(districtId: DistrictId, filters: DistrictFilters): Promise<{
    districtId: DistrictId;
    districtName: string;
    hospitals: number;
    patientsToday: number;
    opdConsultations: number;
    appointments: number;
    waiting: number;
    statuses: { normal: number; highLoad: number; alert: number };
  }> {
    return districtAdminService.getDashboard(districtId, filters);
  },
  async getAnalytics(
    districtId: DistrictId,
    period: "today" | "week" | "month",
    filters: DistrictFilters
  ): Promise<OpdAnalyticsData> {
    return districtAdminService.getAnalytics(districtId, period, filters);
  },
  async listHospitalRows(districtId: DistrictId): Promise<DistrictHospitalRow[]> {
    return districtAdminService.listHospitalRows(districtId);
  },
  async getComparison(districtId: DistrictId): Promise<ComparisonRow[]> {
    return districtAdminService.getComparison(districtId);
  },
  async getCapacity(districtId: DistrictId): Promise<CapacityRow[]> {
    return districtAdminService.getCapacity(districtId);
  },
  async getResources(districtId: DistrictId): Promise<ResourceSummaryRow[]> {
    return districtAdminService.getResources(districtId);
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
    input: Omit<Announcement, "id" | "publishedAt" | "status">,
    actor: AuditActor
  ): Promise<Announcement> {
    return districtAdminService.publishAnnouncement(input, actor);
  },
  async listAudit(
    districtId: DistrictId,
    filters: { action?: string; query?: string }
  ): Promise<DistrictAuditEvent[]> {
    return districtAdminService.listAudit(districtId, filters);
  },
  async getSettings(districtId: DistrictId): Promise<DistrictSettings> {
    return districtAdminService.getSettings(districtId);
  },
  async saveSettings(
    districtId: DistrictId,
    settings: DistrictSettings,
    actor: AuditActor
  ): Promise<DistrictSettings> {
    return districtAdminService.saveSettings(districtId, settings, actor);
  },
  async getReport(
    districtId: DistrictId,
    type: DistrictReportType,
    filters: DistrictFilters = {}
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
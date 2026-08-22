import type { DistrictId } from "@/config/districts";
import type { QueueHealth } from "@/types";
import type { AuditActor } from "@/services/hospital-ops/types";

export type { AuditActor };

export type DistrictDateRange = "today" | "7d" | "30d";

export type DistrictFilters = {
  dateRange: DistrictDateRange;
  hospitalId: string;
  departmentId: string;
  serviceCode: string;
};

export const DEFAULT_DISTRICT_FILTERS: DistrictFilters = {
  dateRange: "today",
  hospitalId: "",
  departmentId: "",
  serviceCode: "",
};

export type HospitalLoadStatus = "normal" | "high_load" | "alert";

export type LoadThresholds = { highLoad: number; alert: number };

export type DistrictHospitalStatusCount = {
  normal: number;
  highLoad: number;
  alert: number;
};

export type DistrictHospitalRow = {
  hospitalId: string;
  name: string;
  address: string;
  phone: string;
  patients: number;
  waiting: number;
  completed: number;
  avgWaitMinutes: number;
  activeOpds: number;
  departments: number;
  doctors: number;
  status: HospitalLoadStatus;
};

export type DistrictStats = {
  districtId: DistrictId;
  districtName: string;
  hospitals: number;
  patientsToday: number;
  opdConsultations: number;
  appointments: number;
  waiting: number;
  statuses: DistrictHospitalStatusCount;
};

export type MapPoint = {
  hospitalId: string;
  x: number;
  y: number;
};

export type ComparisonRow = {
  rank: number;
  hospitalId: string;
  name: string;
  patients: number;
  waiting: number;
  avgWaitMinutes: number;
};

export type OpdAnalyticsPeriod = "today" | "weekly" | "monthly";

export type DepartmentVolumeRow = {
  departmentName: string;
  visits: number;
};

export type OpdAnalyticsData = {
  period: OpdAnalyticsPeriod;
  periodLabel: string;
  totalVisits: number;
  appointments: number;
  walkIns: number;
  completedConsultations: number;
  noShows: number;
  avgWaitMinutes: number;
  avgConsultationMinutes: number;
  departmentVolume: DepartmentVolumeRow[];
};

export type DepartmentPerformanceRow = {
  departmentName: string;
  hospitals: number;
  patients: number;
  completed: number;
  waiting: number;
  avgWaitMinutes: number;
};

export type CapacityStatus = "normal" | "near_capacity" | "exceeded";

export type CapacityRow = {
  hospitalId: string;
  hospitalName: string;
  departmentId: string;
  departmentName: string;
  expectedCapacity: number;
  appointments: number;
  walkIns: number;
  total: number;
  utilizationPercent: number;
  status: CapacityStatus;
};

export type ResourceSummaryRow = {
  hospitalId: string;
  hospitalName: string;
  doctorsTotal: number;
  doctorsAvailable: number;
  nurses: number;
  labStaff: number;
  pharmacyStaff: number;
  otherStaff: number;
  servicesActive: number;
};

export type DoctorAvailabilityRow = {
  departmentId: string;
  departmentName: string;
  available: number;
  onLeave: number;
  unavailable: number;
  doctorNames: string[];
};

export type ServiceAvailabilityRow = {
  serviceName: string;
  code: string;
  providerHospitalIds: string[];
};

export type ReferralFlow = {
  id: string;
  fromHospitalId: string;
  fromHospitalName: string;
  toHospitalId: string;
  toHospitalName: string;
  count: number;
  periodLabel: string;
};

export type AnnouncementAudience = "hospitals" | "departments" | "staff" | "patients";

export type Announcement = {
  id: string;
  title: string;
  message: string;
  audience: AnnouncementAudience;
  targetIds: string[];
  publishedAt: string;
  publishedBy: string;
  status: "draft" | "published";
};

export type DistrictAnnouncementInput = {
  title: string;
  message: string;
  audience: AnnouncementAudience;
  targetIds: string[];
};

export type DistrictAuditAction =
  | "hospital_status_changed"
  | "announcement_published"
  | "district_config_updated"
  | "report_exported"
  | "referral_note_added";

export type DistrictAuditEvent = {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: DistrictAuditAction;
  targetType: string;
  targetId: string;
  summary: string;
};

export type DistrictSettings = {
  reporting: {
    aggregateOnly: boolean;
    includeWalkInsInReports: boolean;
    weeklyReportDay: "monday" | "sunday";
  };
  serviceCatalogueVisible: boolean;
  hospitalActivationOverrides: Record<string, "active" | "inactive">;
};

export type DistrictReportType =
  | "daily_district_opd"
  | "hospital_performance"
  | "department_report"
  | "queue_waiting"
  | "appointment_report"
  | "service_utilization"
  | "staff_availability"
  | "hospital_capacity"
  | "referral_summary";

export type DistrictQueueItem = {
  opdId: string;
  hospitalId: string;
  hospitalName: string;
  departmentName: string;
  status: string;
  nowServing: string | null;
  waiting: number;
  health: QueueHealth;
};

import type { DistrictId } from "@/config/districts";
import type {
  QueueHealth,
  GovernmentAlert,
  HospitalStatus,
  Announcement,
  AnnouncementStatus,
  AnnouncementTargetType,
} from "@/types";
import type { AuditActor } from "@/services/hospital-ops/types";
export { QueueHealth, Announcement, AnnouncementStatus, AnnouncementTargetType }

export type StateDateRange = "today" | "7d" | "30d";

export type StateFilters = {
  dateRange: StateDateRange;
  districtId?: DistrictId | "";
  hospitalId?: string;
  departmentId?: string;
};

export type StateStats = {
  stateName: string;
  districts: number;
  hospitals: number;
  patientsToday: number;
  opdConsultations: number;
  appointments: number;
  waiting: number;
  activeOpds: number;
  avgWaitMinutes: number;
  statuses: {
    normal: number;
    highLoad: number;
    alert: number;
  };
};

export type DistrictComparisonRow = {
  districtId: DistrictId;
  districtName: string;
  hospitals: number;
  patients: number;
  waiting: number;
  avgWaitMinutes: number;
  completed: number;
  status: QueueHealth;
};

export type HospitalType = "government_hospital" | "medical_college" | "general_hospital" | "district_hospital";

export type StateHospitalRow = {
  hospitalId: string;
  name: string;
  districtId: DistrictId;
  districtName: string;
  type: HospitalType;
  status: HospitalStatus;
  patients: number;
  waiting: number;
  completed: number;
  avgWaitMinutes: number;
  servicesCount: number;
  load: "normal" | "high_load" | "alert";
};

export type StateServiceAvailabilityRow = {
  serviceName: string;
  code: string;
  hospitalCount: number;
  districtCount: number;
};

export type StateCapacityRow = {
  districtId: DistrictId;
  districtName: string;
  opdCapacity: number;
  todaysLoad: number;
  utilizationPercent: number;
  status: "normal" | "near_capacity" | "exceeded";
};

export type ResourceTotals = {
  doctors: number;
  nurses: number;
  labStaff: number;
  pharmacyStaff: number;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type StateAnalyticsData = {
  period: "daily" | "weekly" | "monthly" | "yearly";
  periodLabel: string;
  totalVisits: number;
  appointments: number;
  walkIns: number;
  completedConsultations: number;
  avgWaitMinutes: number;
  noShows: number;
  hospitalUtilization: number;
  trends: {
    opdVolume: TrendPoint[];
    avgWaitTime: TrendPoint[];
    utilization: TrendPoint[];
    appointmentUtilization: TrendPoint[];
  };
};

export type StateAlertSummary = {
  critical: number;
  warning: number;
  notice: number;
  items: GovernmentAlert[];
};

export type StateAnnouncement = {
  id: string;
  title: string;
  message: string;
  status: AnnouncementStatus;
  targetType: AnnouncementTargetType;
  targetIds: string[]; // districtIds or hospitalIds
  publishedAt: string | null;
  scheduledAt: string | null;
  expiresAt: string | null;
  publishedBy: string;
  createdAt: string;
};

export type StateAuditAction =
  | "announcement_published"
  | "announcement_scheduled"
  | "announcement_cancelled"
  | "user_status_changed"
  | "user_role_changed"
  | "config_updated"
  | "report_exported"
  | "emergency_mode_toggled"
  | "report_scheduled";

export type StateAuditEvent = {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: StateAuditAction;
  targetType: string;
  targetId: string;
  summary: string;
  result: "success" | "failure";
};

export type StateUserRow = {
  id: string;
  name: string;
  role: string;
  districtId?: DistrictId;
  hospitalId?: string;
  status: "active" | "inactive";
  lastLogin: string | null;
};

export type SystemHealthStatus = "healthy" | "degraded" | "down";

export type SystemHealthItem = {
  id: string;
  service: string;
  status: SystemHealthStatus;
  lastCheckedAt: string;
  detail?: string;
};

export type SystemHealthData = {
  overall: SystemHealthStatus;
  services: SystemHealthItem[];
  incidents: Array<{
    id: string;
    title: string;
    severity: "critical" | "warning";
    status: "active" | "resolved";
    createdAt: string;
  }>;
};

export type EmergencyMode = {
  active: boolean;
  activatedAt?: string;
  activatedBy?: string;
  reason?: string;
  scope: "state" | "district" | "hospital";
  scopeId?: string;
};

export type StateConfig = {
  hospitalTypes: string[];
  standardDepartments: string[];
  standardServices: string[];
  permissions: Record<string, string[]>;
  notificationRules: {
    highWaitThreshold: number;
    criticalWaitThreshold: number;
  };
};

export type ScheduledReport = {
  id: string;
  reportType: string;
  title: string;
  schedule: "daily" | "weekly" | "monthly";
  recipients: string[];
  format: "csv" | "pdf";
  nextRunAt: string;
  status: "active" | "paused";
};

export type StateReportType =
  | "opd_performance"
  | "hospital_performance"
  | "district_performance"
  | "service_availability"
  | "capacity_report"
  | "waiting_time_report"
  | "appointment_report"
  | "diagnostic_report"
  | "resource_report";

import type { DistrictId } from "@/config/districts";
import type { StaffRole } from "@/types";
import type { UserRole } from "@/features/auth/types/auth.types";
import type { Workday } from "@/services/appointments/types";

export type HospitalAddress = {
  line1: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
};

export type HospitalProfile = {
  id: string;
  name: string;
  code: string;
  districtId: DistrictId;
  address: HospitalAddress;
  phone: string;
  email: string;
  status: "active" | "inactive";
  departmentIds: string[];
};

export type DepartmentConfig = {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  status: "active" | "inactive";
  opdAvailabilityDays: Workday[];
  serviceIds: string[];
};

export type OpsStaffRole = StaffRole | "doctor";

export type StaffProfile = {
  id: string;
  hospitalId: string;
  employeeId: string;
  userId?: string;
  name: string;
  role: OpsStaffRole;
  departmentId?: string;
  speciality?: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  joinedAt: string;
};

export type AssignableUserRole = Exclude<UserRole, "patient">;

export type RoleAssignment = {
  id: string;
  userId: string;
  userName: string;
  hospitalId: string;
  departmentId?: string;
  role: AssignableUserRole;
  assignedAt: string;
  assignedBy: string;
};

export type ScheduleBreak = { start: string; end: string };

export type OpsDaySchedule = { open: string; close: string; breaks: ScheduleBreak[] };

export type OpdWeeklySchedule = {
  id: string;
  hospitalId: string;
  departmentId: string;
  days: Record<Workday, OpsDaySchedule | null>;
  slotDurationMinutes: number;
  maxAppointmentsPerDay: number;
  doctorIds: string[];
  updatedAt?: string;
};

export type ScheduleExceptionType =
  | "cancelled"
  | "doctor_unavailable"
  | "emergency_closure"
  | "holiday"
  | "custom_hours";

export type ScheduleException = {
  id: string;
  hospitalId: string;
  departmentId: string;
  opdId?: string;
  doctorId?: string;
  date: string;
  type: ScheduleExceptionType;
  reason: string;
  customOpen?: string;
  customClose?: string;
  status: "active" | "resolved";
  createdAt: string;
  createdBy: string;
};

export type DepartmentQueueConfig = {
  departmentId: string;
  tokenPrefix: string;
  priorityEnabled: boolean;
  emergencySeparateQueue: boolean;
};

export type TokenConfig = {
  hospitalId: string;
  dailyReset: boolean;
  format: "PREFIX-NNN";
  maxDailyTokens: number;
};

export type HospitalServiceEntry = {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  departmentId?: string;
  status: "active" | "inactive";
  availability: string;
};

export type OperationalAuditAction =
  | "department_updated"
  | "staff_added"
  | "staff_updated"
  | "role_assigned"
  | "role_removed"
  | "schedule_updated"
  | "exception_created"
  | "exception_resolved"
  | "queue_config_updated"
  | "token_config_updated"
  | "service_updated"
  | "opd_status_changed";

export type AuditActor = {
  id: string;
  name: string;
  role: string;
};

export type OperationalAuditEvent = {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: OperationalAuditAction;
  targetType: string;
  targetId?: string;
  summary: string;
};

export type OperationalAlertType =
  | "queue_delay"
  | "lab_backlog"
  | "doctor_unavailable"
  | "opd_cancelled";

export type OperationalAlertSeverity = "critical" | "warning" | "info";

export type OperationalAlert = {
  id: string;
  type: OperationalAlertType;
  severity: OperationalAlertSeverity;
  title: string;
  detail: string;
  departmentName?: string;
};

export type DashboardDateRange = "today" | "7d" | "30d";

export type DashboardShift = "all" | "morning" | "afternoon";

export type DashboardFilters = {
  dateRange: DashboardDateRange;
  departmentId: string;
  doctorId: string;
  shift: DashboardShift;
};

export type DepartmentOpsSummary = {
  departmentId: string;
  departmentName: string;
  patients: number;
  completed: number;
  waiting: number;
  cancelled: number;
};

export type StaffWorkloadRow = {
  doctorId: string;
  doctorName: string;
  departmentName: string;
  patients: number;
  completed: number;
  waiting: number;
};

export type OpsOverview = {
  patientsToday: number;
  appointmentsToday: number;
  completedOpd: number;
  waiting: number;
  emergency: number;
};

export type OpsDashboardData = {
  overview: OpsOverview;
  departments: DepartmentOpsSummary[];
  alerts: OperationalAlert[];
  workload: StaffWorkloadRow[];
};

export type ReportType =
  | "daily_opd"
  | "department_performance"
  | "appointment_report"
  | "queue_report"
  | "patient_volume"
  | "doctor_workload"
  | "laboratory_volume"
  | "pharmacy_volume";

export type ReportTable = {
  columns: string[];
  rows: Array<Array<string | number>>;
};

export type OpsReport = {
  type: ReportType;
  title: string;
  period: string;
  summary: Array<{ label: string; value: string | number }>;
  table: ReportTable;
};

export type AffectedAppointment = {
  appointmentId: string;
  patientName: string;
  scheduledTime?: string;
  type: string;
  status: string;
  doctorName?: string;
};

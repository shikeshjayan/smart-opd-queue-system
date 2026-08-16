import type {
  AdminNotification,
  Department,
  DoctorRecord,
  Encounter,
  Hospital,
  OPD,
  OPDCounts,
  OPDStatus,
  PatientSummary,
  QueueHealth,
} from "@/types";

export type HospitalStats = {
  departments: number;
  opds: number;
  opdsOpen: number;
  doctors: number;
  doctorsActive: number;
  staff: number;
  patients: number;
  tokensToday: number;
  waiting: number;
  completed: number;
};

export type QueueOverviewItem = {
  opdId: string;
  opdName: string;
  departmentId: string;
  departmentName: string;
  startTime: string;
  endTime: string;
  status: OPDStatus;
  nowServing: string | null;
  waiting: number;
  total: number;
  completed: number;
  health: QueueHealth;
};

export type AdminDashboardData = {
  hospital: Hospital;
  stats: HospitalStats;
  queueOverview: QueueOverviewItem[];
  alerts: AdminNotification[];
};

export type AdminDepartmentDetail = {
  department: Department;
  opds: OPD[];
  doctors: DoctorRecord[];
  waiting: number;
};

export type AdminOpdDetail = {
  opd: OPD;
  department: Department | undefined;
  doctor: DoctorRecord | undefined;
  counts: OPDCounts;
  health: QueueHealth;
};

export type AdminDoctorDetail = {
  doctor: DoctorRecord;
  departmentName: string;
  opds: OPD[];
};

export type AdminPatientDetail = {
  patient: PatientSummary;
  encounters: Encounter[];
};

export type AdminReportDepartment = {
  departmentId: string;
  departmentName: string;
  tokens: number;
  waiting: number;
  completed: number;
};

export type AdminReport = {
  hospital: Hospital;
  period: string;
  totals: {
    tokens: number;
    completed: number;
    consultations: number;
    missed: number;
  };
  byDepartment: AdminReportDepartment[];
  recentEncounters: Encounter[];
};

export type AdminSettingsInput = {
  queueHealthThresholds: {
    warning: number;
    critical: number;
  };
  opdOpenTime: string;
  opdCloseTime: string;
  tokenWindowMinutes: number;
};

import type {
  DistrictPerformance,
  DoctorRecord,
  GovernmentAlert,
  Hospital,
  OPD,
  OPDStatus,
  QueueHealth,
} from "@/types";
import type { DistrictId } from "@/config/districts";
import type { Department } from "@/types";

export type GovernmentQueueItem = {
  opdId: string;
  opdName: string;
  hospitalId: string;
  hospitalName: string;
  districtId: DistrictId;
  departmentId: string;
  departmentName: string;
  status: OPDStatus;
  nowServing: string | null;
  waiting: number;
  total: number;
  completed: number;
  health: QueueHealth;
};

export type GovernmentHospitalRow = {
  hospital: Hospital;
  districtId: DistrictId;
  patientsToday: number;
  waiting: number;
  completed: number;
  activeOpds: number;
  departments: number;
  doctors: number;
  health: QueueHealth;
};

export type DistrictDashboardData = {
  district: {
    id: DistrictId;
    name: string;
  };
  performance: DistrictPerformance;
  hospitals: GovernmentHospitalRow[];
  queueOverview: GovernmentQueueItem[];
  alerts: GovernmentAlert[];
  longestQueue: {
    hospitalName: string;
    departmentName: string;
    waiting: number;
  } | null;
};

export type StateDashboardData = {
  state: {
    name: string;
    districts: number;
    hospitals: number;
  };
  totals: {
    patientsToday: number;
    waiting: number;
    completed: number;
    activeOpds: number;
    avgWaitMinutes: number;
  };
  districts: DistrictPerformance[];
  criticalAlerts: GovernmentAlert[];
  bottlenecks: Array<{
    hospitalId: string;
    hospitalName: string;
    districtId: DistrictId;
    departmentName: string;
    waiting: number;
  }>;
};

export type GovernmentHospitalDetail = {
  hospital: Hospital;
  districtName: string;
  stats: {
    departments: number;
    opds: number;
    opdsOpen: number;
    doctors: number;
    waiting: number;
    completed: number;
  };
  departments: Array<{
    department: Department;
    waiting: number;
  }>;
  opds: OPD[];
  doctors: DoctorRecord[];
  queues: GovernmentQueueItem[];
};

export type GovernmentReportRow = {
  id: string;
  label: string;
  tokens: number;
  completed: number;
  waiting: number;
};

export type GovernmentReport = {
  scope: "state" | "district";
  scopeName: string;
  period: string;
  totals: {
    tokens: number;
    completed: number;
    consultations: number;
    missed: number;
  };
  rows: GovernmentReportRow[];
  recentEncounters: Array<{
    id: string;
    patientName: string;
    hospitalName: string;
    departmentName: string;
    date: string;
  }>;
};

export type GovernmentReportFilters = {
  districtId?: DistrictId;
  hospitalId?: string;
  departmentId?: string;
  from?: string;
  to?: string;
};

export type QueueMonitorFilters = {
  hospitalId?: string;
  departmentId?: string;
  status?: OPDStatus | "";
  minWaiting?: number;
};

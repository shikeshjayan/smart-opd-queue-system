import type { DistrictId } from "@/config/districts";

export type HospitalStatus = "active" | "inactive";

export type Hospital = {
  id: string;
  name: string;
  district: DistrictId;
  address: string;
  phone: string;
  opdCount: number;
  status: HospitalStatus;
};

export type DepartmentStatus = "active" | "inactive";

export type Department = {
  id: string;
  hospitalId: string;
  name: string;
  waitingCount: number;
  status: DepartmentStatus;
};

export type OPDStatus = "open" | "closed" | "full" | "unavailable";

export type OPD = {
  id: string;
  departmentId: string;
  name: string;
  startTime: string;
  endTime: string;
  status: OPDStatus;
  currentlyServing: string | null;
  estimatedWaitMinutes: number | null;
};

export type QueueStatus =
  | "waiting"
  | "called"
  | "in_consultation"
  | "completed"
  | "skipped"
  | "cancelled"
  | "expired"
  | "no_show";

export type TokenStatus = QueueStatus;

export type Token = {
  id: string;
  tokenNumber: string;
  patientId: string;
  opdId: string;
  status: TokenStatus;
  patientsAhead: number;
  estimatedWaitMinutes: number | null;
};

export type QueueEntry = {
  tokenNumber: string;
  status: QueueStatus;
  isCurrentUser: boolean;
  patientId: string | null;
  patientName: string | null;
  isPriority?: boolean;
};

export type TokenBundle = {
  hospital: Hospital;
  department: Department;
  opd: OPD;
  token: Token;
};

export type DoctorProfile = {
  id: string;
  name: string;
  speciality: string;
  hospitalId: string;
  hospitalName: string;
  departmentId: string;
  departmentName: string;
  opdId: string;
  opdName: string;
};

export type PatientKnownInfo = {
  allergies: string[];
  medications: string[];
  conditions: string[];
};

export type PatientSummary = {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  phone: string;
  bloodGroup?: string;
  registeredHospitalId: string;
  knownInfo: PatientKnownInfo;
};

export type ConsultationStatus = "draft" | "completed";

export type Encounter = {
  id: string;
  patientId: string;
  doctorId: string;
  opdId: string;
  tokenNumber: string;
  date: string;
  hospitalName: string;
  departmentName: string;
  doctorName: string;
  chiefComplaint: string;
  symptoms: string;
  observations: string;
  assessment: string;
  plan: string;
  status: ConsultationStatus;
  createdAt: string;
  updatedAt: string;
};

export type OPDCounts = {
  total: number;
  completed: number;
  waiting: number;
  skipped: number;
  inConsultation: number;
  cancelled: number;
};

export type DoctorRecord = {
  id: string;
  hospitalId: string;
  departmentId: string;
  name: string;
  speciality: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  joinedAt: string;
  opdIds: string[];
};

export type StaffRole =
  | "receptionist"
  | "nurse"
  | "pharmacist"
  | "lab_technician"
  | "accountant"
  | "administrator";

export type StaffMember = {
  id: string;
  hospitalId: string;
  name: string;
  role: StaffRole;
  phone: string;
  email: string;
  status: "active" | "inactive";
  joinedAt: string;
};

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  hospitalId: string;
};

export type QueueHealth = "healthy" | "warning" | "critical";

export type AdminSettings = {
  hospitalId: string;
  queueHealthThresholds: {
    warning: number;
    critical: number;
  };
  opdOpenTime: string;
  opdCloseTime: string;
  tokenWindowMinutes: number;
  updatedAt: string;
  updatedBy: string;
};

export type AdminNotificationType = "queue" | "system" | "alert" | "info";

export type AdminNotification = {
  id: string;
  hospitalId: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type DistrictAdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  districtId: DistrictId;
};

export type StateAdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export type GovernmentAlertSeverity = "critical" | "warning" | "info";

export type GovernmentAlertType =
  | "doctor_unavailable"
  | "queue_above_threshold"
  | "long_wait"
  | "opd_full"
  | "system";

export type GovernmentAlertStatus = "active" | "resolved";

export type GovernmentAlert = {
  id: string;
  districtId: DistrictId;
  hospitalId: string;
  hospitalName: string;
  departmentName: string;
  severity: GovernmentAlertSeverity;
  type: GovernmentAlertType;
  message: string;
  createdAt: string;
  status: GovernmentAlertStatus;
};

export type DistrictPerformance = {
  districtId: DistrictId;
  districtName: string;
  hospitals: number;
  activeOpds: number;
  patientsToday: number;
  waiting: number;
  completed: number;
  avgWaitMinutes: number;
  longestQueue: {
    hospitalName: string;
    departmentName: string;
  } | null;
};

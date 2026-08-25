import type { DistrictId } from "@/config/districts";

export type HospitalStatus = "active" | "inactive";

export type HospitalType = "general" | "district" | "taluk" | "specialty" | "medical_college";

export type Hospital = {
  id: string;
  name: string;
  code: string;
  district: DistrictId;
  address: string;
  phone: string;
  emergencyContact?: string;
  type?: HospitalType;
  opdCount: number;
  status: HospitalStatus;
};

export type DepartmentStatus = "active" | "inactive";

export type Department = {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  waitingCount: number;
  status: DepartmentStatus;
  dailyCapacity?: number;
  avgConsultationMinutes?: number;
  appointmentAllocationPct?: number;
  walkInAllocationPct?: number;
};

export type OPDStatus = "open" | "closed" | "full" | "paused" | "unavailable";

export type OPD = {
  id: string;
  departmentId: string;
  name: string;
  startTime: string;
  endTime: string;
  status: OPDStatus;
  currentlyServing: string | null;
  estimatedWaitMinutes: number | null;
  statusReason?: string;
  statusUpdatedAt?: string;
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

export type QueuePriority = "normal" | "priority" | "emergency";

export type QueueEntry = {
  tokenNumber: string;
  status: QueueStatus;
  isCurrentUser: boolean;
  patientId: string | null;
  patientName: string | null;
  priority: QueuePriority;
  overrideAhead?: boolean;
  position?: number;
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
  patientNumber?: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  phone: string;
  bloodGroup?: string;
  registeredHospitalId: string;
  knownInfo: PatientKnownInfo;
};

export type EncounterStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled";

export type Encounter = {
  id: string;
  patientId: string;
  hospitalId: string;
  departmentId: string;
  doctorId: string;
  opdId: string;
  tokenId?: string;
  tokenNumber: string;
  date: string;
  hospitalName: string;
  departmentName: string;
  doctorName: string;
  status: EncounterStatus;
  startedAt?: string;
  completedAt?: string;
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

/* ---------- Phase 26 — Hospital Operations & Staff Management ---------- */

export type StaffAssignmentStatus = "active" | "inactive";

export type StaffAssignment = {
  id: string;
  staffId: string;
  hospitalId: string;
  departmentId?: string | null;
  role: string;
  startDate: string;
  endDate?: string | null;
  status: StaffAssignmentStatus;
  createdAt: string;
  updatedAt: string;
};

export type StaffLeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export type StaffLeave = {
  id: string;
  staffId: string;
  hospitalId: string;
  departmentId?: string | null;
  fromDate: string;
  toDate: string;
  reason: string;
  status: StaffLeaveStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
};

export type RoomType = "opd" | "lab" | "radiology" | "procedure" | "pharmacy" | "other";

export type RoomStatus = "active" | "inactive" | "maintenance";

export type Room = {
  id: string;
  hospitalId: string;
  code: string;
  name?: string;
  type: RoomType;
  departmentId?: string | null;
  floor?: string;
  status: RoomStatus;
};

export type HospitalServiceCategory =
  | "opd"
  | "laboratory"
  | "radiology"
  | "pharmacy"
  | "emergency"
  | "other";

export type HospitalService = {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  category: HospitalServiceCategory;
  departmentId?: string | null;
  description?: string;
  status: "active" | "inactive";
};

export type ShiftTemplate = {
  id: string;
  hospitalId: string;
  name: string;
  startTime: string;
  endTime: string;
  departmentId?: string | null;
  breakMinutes?: number;
  status: "active" | "inactive";
};

export type OpdSessionState =
  | "scheduled"
  | "open"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

export type OpdSession = {
  id: string;
  hospitalId: string;
  departmentId: string;
  opdId: string;
  doctorId?: string | null;
  roomId?: string | null;
  shiftId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  state: OpdSessionState;
  plannedCapacity: number;
  tokensIssued: number;
  tokensCompleted: number;
  pauseReason?: string | null;
  expectedResumeAt?: string | null;
  pausedAt?: string | null;
  resumedAt?: string | null;
  openedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
};

export type ClosureScope = "hospital" | "department";

export type ClosureType = "holiday" | "maintenance" | "emergency";

export type ClosureStatus = "planned" | "active" | "resolved" | "cancelled";

export type HospitalClosure = {
  id: string;
  hospitalId: string;
  scope: ClosureScope;
  departmentId?: string | null;
  type: ClosureType;
  fromDate: string;
  toDate: string;
  reason: string;
  status: ClosureStatus;
  affectedTotal: number;
  affectedRescheduled: number;
  affectedCancelled: number;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
};

export type ConfigFieldChange = {
  field: string;
  before: unknown;
  after: unknown;
};

export type ConfigVersionEntity =
  | "adminsettings"
  | "scheduleconfig"
  | "department_capacity"
  | "hospital_profile";

export type ConfigVersion = {
  id: string;
  hospitalId: string;
  entity: ConfigVersionEntity;
  entityId: string;
  changes: ConfigFieldChange[];
  note?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
};

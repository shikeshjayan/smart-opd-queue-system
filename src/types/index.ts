import type { DistrictId } from "@/config/districts";

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

/* ---------- Phase 28 — Medical Records & Patient History ---------- */

export type PatientGender = "male" | "female" | "other";

export type PatientIdentity = {
  name: string;
  dateOfBirth?: string;
  gender?: PatientGender;
};

export type PatientContact = {
  mobile?: string;
  email?: string;
};

export type PatientAddress = {
  district?: string;
  state?: string;
  line1?: string;
  line2?: string;
  pincode?: string;
};

export type PatientEmergencyContact = {
  name?: string;
  relationship?: string;
  mobile?: string;
};

export type PatientStatus = "active" | "inactive";

export type Patient = {
  id: string;
  patientNumber: string;
  identity: PatientIdentity;
  contact: PatientContact;
  address?: PatientAddress;
  emergencyContact?: PatientEmergencyContact;
  bloodGroup?: string;
  registeredHospitalId: string;
  knownInfo: PatientKnownInfo;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
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

export type EncounterType = "opd" | "emergency" | "follow_up" | "diagnostic" | "other";

export type EncounterStatus =
  | "open"
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type Encounter = {
  id: string;
  patientId: string;
  hospitalId: string;
  departmentId?: string;
  doctorId?: string;
  appointmentId?: string;
  opdSessionId?: string;
  opdId?: string;
  tokenId?: string;
  tokenNumber?: string;
  type?: EncounterType;
  status: EncounterStatus;
  date: string;
  hospitalName?: string;
  departmentName?: string;
  doctorName?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AllergySeverity = "mild" | "moderate" | "severe";
export type AllergyStatus = "active" | "resolved" | "unknown";

export type Allergy = {
  id: string;
  patientId: string;
  substance: string;
  reaction?: string;
  severity?: AllergySeverity;
  status: AllergyStatus;
  recordedAt: string;
  recordedBy: string;
};

export type ConditionStatus = "active" | "resolved" | "inactive" | "unknown";

export type Condition = {
  id: string;
  patientId: string;
  name: string;
  status: ConditionStatus;
  diagnosedAt?: string;
  recordedBy: string;
  createdAt: string;
};

export type VitalSigns = {
  id: string;
  patientId: string;
  encounterId?: string;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  oxygenSaturation?: number;
  heightCm?: number;
  weightKg?: number;
  recordedAt: string;
  recordedBy: string;
};

export type RecordVisibility = "draft" | "final" | "reviewed" | "released" | "restricted";

export type BreakGlassStatus = "pending" | "approved" | "denied" | "expired";

export type BreakGlassRequest = {
  id: string;
  patientId: string;
  requestorId: string;
  requestorName: string;
  requestorRole: string;
  reason: string;
  hospitalId: string;
  status: BreakGlassStatus;
  expiresAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
};

export type CorrectionRequestStatus = "pending" | "approved" | "rejected";

export type CorrectionRequest = {
  id: string;
  patientId: string;
  requestorId: string;
  targetType: "patient_profile" | "allergy" | "condition" | "diagnosis" | "prescription";
  targetId?: string;
  requestedChanges: Record<string, { before: unknown; after: unknown }>;
  reason?: string;
  status: CorrectionRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
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

/* ---------- Phase 27 — State & District Governance ---------- */

export type DistrictStatus = "active" | "inactive";

export type District = {
  id: string;
  code: string;
  name: string;
  stateId: string;
  headquarters?: { lat: number; lng: number };
  status: DistrictStatus;
  createdAt: string;
  updatedAt: string;
};

export type HospitalType =
  | "general"
  | "district"
  | "taluk"
  | "specialty"
  | "medical_college"
  | "chc"
  | "phc";

export type HospitalStatus = "draft" | "config" | "verification" | "active" | "suspended" | "inactive";

export type Hospital = {
  id: string;
  name: string;
  code: string;
  districtId: DistrictId;
  address: string;
  phone: string;
  emergencyContact?: string;
  type: HospitalType;
  status: HospitalStatus;
  opdCount?: number;
  capacity: {
    beds: number;
    opds: number;
    labs: number;
  };
  adminContact: {
    name: string;
    phone: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type StateSettings = {
  id: string;
  stateId: string;
  appointmentRules: {
    defaultDuration: number;
    maxAdvanceDays: number;
    cancellationPolicy: string;
  };
  queueRules: {
    priorityWeights: Record<string, number>;
    thresholdAlerts: { warning: number; critical: number };
  };
  notificationPolicies: {
    channels: string[];
    templates: Record<string, string>;
  };
  supportedLanguages: string[];
  securityPolicies: {
    sessionTimeout: number;
    mfaRequired: boolean;
    ipWhitelist: string[];
  };
  featureFlags: Record<string, boolean>;
  auditPolicies: {
    retentionDays: number;
    logLevel: string;
  };
  medicalRecordRetention: {
    years: number;
    archiveStrategy: string;
  };
  updatedAt: string;
  updatedBy: string;
};

export type DistrictConfig = {
  id: string;
  districtId: DistrictId;
  overrides: Partial<StateSettings>;
  effectiveSettings: StateSettings;
  updatedAt: string;
  updatedBy: string;
};

export type HospitalConfig = {
  id: string;
  hospitalId: string;
  overrides: Partial<StateSettings>;
  effectiveSettings: StateSettings;
  updatedAt: string;
  updatedBy: string;
};

export type GovernmentAlertSeverity = "critical" | "warning" | "info";

export type GovernmentAlertType =
  | "doctor_unavailable"
  | "queue_above_threshold"
  | "long_wait"
  | "opd_full"
  | "system"
  | "capacity_exceeded"
  | "lab_backlog"
  | "pharmacy_shortage"
  | "queue_backlog"
  | "high_wait"
  | "high_volume";

export type GovernmentAlertStatus = "active" | "open" | "acknowledged" | "investigating" | "resolved";

export type GovernmentAlert = {
  id: string;
  districtId: DistrictId;
  hospitalId: string;
  hospitalName: string;
  departmentName?: string;
  severity: GovernmentAlertSeverity;
  type: GovernmentAlertType;
  status: GovernmentAlertStatus;
  message: string;
  assignedTo?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
};

export type AuditActionType =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "EXPORT"
  | "CONFIG_CHANGE"
  | "PERMISSION_CHANGE"
  | "MEDICAL_RECORD_ACCESS"
  | "STAFF_ASSIGNMENT"
  | "HOSPITAL_STATUS_CHANGE"
  | "DISTRICT_CONFIG_CHANGE"
  | "STATE_CONFIG_CHANGE";

export type AuditResult = "success" | "failure" | "partial";

export type AuditLog = {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: AuditActionType;
  resourceType: string;
  resourceId: string;
  hospitalId?: string;
  districtId?: string;
  timestamp: string;
  result: AuditResult;
  detail: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    fieldsChanged?: string[];
    accessType?: string;
  };
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
};

export type OutboxEventStatus = "pending" | "processing" | "completed" | "failed";

export type OutboxEvent = {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  processedAt?: string;
  retryCount: number;
  status: OutboxEventStatus;
};

export type DailyHospitalMetrics = {
  id: string;
  hospitalId: string;
  districtId: string;
  date: string;
  totalAppointments: number;
  totalVisits: number;
  totalWaiting: number;
  appointments: number;
  walkIns: number;
  completedVisits: number;
  noShows: number;
  avgWaitMinutes: number;
  avgConsultationMinutes: number;
  departmentBreakdown: Array<{
    departmentId: string;
    departmentName: string;
    visits: number;
    avgWaitMinutes: number;
  }>;
  queueHealth: Array<{
    opdId: string;
    waiting: number;
    completed: number;
    avgWaitMinutes: number;
  }>;
  createdAt: string;
};

export type DailyDistrictMetrics = {
  id: string;
  districtId: string;
  date: string;
  hospitals: number;
  totalVisits: number;
  completedVisits: number;
  appointments: number;
  walkIns: number;
  avgWaitMinutes: number;
  totalWaiting: number;
  queueHealth: QueueHealth;
  hospitalsByStatus: { normal: number; highLoad: number; critical: number };
  departmentBreakdown: Array<{ departmentId: string; departmentName: string; visits: number }>;
  topDepartments: Array<{ departmentId: string; departmentName: string; visits: number }>;
  createdAt: string;
};

export type DailyStateMetrics = {
  id: string;
  stateId: string;
  date: string;
  districts: number;
  hospitals: number;
  activeHospitals: number;
  totalVisits: number;
  completedVisits: number;
  appointments: number;
  walkIns: number;
  avgWaitMinutes: number;
  noShowRate: number;
  hospitalUtilization: number;
  districtBreakdown: Array<{
    districtId: string;
    districtName: string;
    visits: number;
    avgWaitMinutes: number;
  }>;
  createdAt: string;
};

export type CurrentHospitalCapacity = {
  id: string;
  hospitalId: string;
  departmentId: string;
  availableSlots: number;
  occupiedSlots: number;
  waitingCount: number;
  lastUpdated: string;
};

/* ---------- Phase 27 — Announcements (state/district broadcasts) ---------- */

export type AnnouncementTargetType = "all" | "districts" | "hospitals";
export type AnnouncementStatus = "draft" | "scheduled" | "published" | "expired";

export type Announcement = {
  id: string;
  title: string;
  message: string;
  targetType: AnnouncementTargetType;
  targetIds: string[];
  districtId?: string;
  hospitalId?: string;
  audience?: "hospitals" | "departments" | "staff" | "patients";
  publishedAt: string | null;
  scheduledAt: string | null;
  expiresAt: string | null;
  publishedBy: string;
  status: AnnouncementStatus;
  createdAt: string;
  updatedAt: string;
};

import type {
  DepartmentConfig,
  DepartmentQueueConfig,
  DepartmentOpsSummary,
  AffectedAppointment,
  AuditActor,
  DashboardFilters,
  HospitalProfile,
  HospitalServiceEntry,
  OperationalAlert,
  OperationalAuditAction,
  OperationalAuditEvent,
  OpsDashboardData,
  OpsDaySchedule,
  OpdWeeklySchedule,
  OpsReport,
  OpsStaffRole,
  ReportType,
  RoleAssignment,
  AssignableUserRole,
  ScheduleException,
  ScheduleExceptionType,
  StaffProfile,
  StaffWorkloadRow,
  TokenConfig,
} from "./types";
import type { Workday } from "@/services/appointments/types";
import {
  HOSPITAL_ADMIN,
  countCompletedTokensByHospital,
  countTokensByHospital,
  countWaitingByHospital,
  countWaitingByOpd,
  getDepartment,
  getPatient,
  listAllEncounters,
  listDepartments,
  listDoctorsByHospital,
  listOpdsByHospital,
  listQueue,
} from "@/services/data";
import { adminService, queueHealthFor } from "@/services/admin";
import {
  appointmentService,
} from "@/services/appointments";
import type { ScheduleConfig } from "@/services/appointments/types";
import { diagnosticsService } from "@/services/diagnostics";
import { prescriptionService } from "@/services/prescription";
import { registrationService } from "@/services/registration";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));
const STORE_KEY = "smart-health.hospital-ops.v1";
export const AVG_CONSULTATION_MINUTES = 5;
const LAB_BACKLOG_THRESHOLD = 15;

export const WEEKDAYS: Array<{ value: Workday; label: string }> = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
  { value: "sun", label: "Sunday" },
];

type OpsStore = {
  hospitalProfiles: HospitalProfile[];
  departmentConfigs: DepartmentConfig[];
  staffProfiles: StaffProfile[];
  roleAssignments: RoleAssignment[];
  schedules: OpdWeeklySchedule[];
  exceptions: ScheduleException[];
  queueConfigs: DepartmentQueueConfig[];
  tokenConfigs: TokenConfig[];
  services: HospitalServiceEntry[];
  audit: OperationalAuditEvent[];
};

function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function weekdayFor(dateISO: string): Workday {
  const names: Workday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const day = new Date(`${dateISO}T00:00:00`).getDay();
  return names[day] ?? "mon";
}

export function weekdayLabelFor(dateISO: string): Workday {
  return weekdayFor(dateISO);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function session(open: string, close: string, breaks: Array<{ start: string; end: string }> = []): OpsDaySchedule {
  return { open, close, breaks };
}

function seedStore(): OpsStore {
  const today = todayISO();
  return {
    hospitalProfiles: [
      {
        id: "hos_001",
        name: "Government Hospital Ernakulam",
        code: "GH-EKM",
        districtId: "ernakulam",
        address: {
          line1: "MG Road, Ernakulam",
          city: "Kochi",
          district: "Ernakulam",
          state: "Kerala",
          pincode: "682016",
        },
        phone: "+91 484 238 1000",
        email: "office@gh-ernakulam.gov.in",
        status: "active",
        departmentIds: ["dep_001", "dep_002", "dep_003", "dep_004"],
      },
    ],
    departmentConfigs: [
      { id: "dep_001", hospitalId: "hos_001", name: "Cardiology", code: "CARD", status: "active", opdAvailabilityDays: ["mon", "tue", "wed", "thu", "fri", "sat"], serviceIds: ["svc_001", "svc_006"] },
      { id: "dep_002", hospitalId: "hos_001", name: "General Medicine", code: "GM", status: "active", opdAvailabilityDays: ["mon", "tue", "wed", "thu", "fri", "sat"], serviceIds: ["svc_001"] },
      { id: "dep_003", hospitalId: "hos_001", name: "Orthopedics", code: "ORTH", status: "active", opdAvailabilityDays: ["mon", "tue", "wed", "thu", "fri"], serviceIds: ["svc_001", "svc_003"] },
      { id: "dep_004", hospitalId: "hos_001", name: "Pediatrics", code: "PED", status: "active", opdAvailabilityDays: ["mon", "tue", "wed", "thu", "fri", "sat"], serviceIds: ["svc_001"] },
    ],
    staffProfiles: [
      { id: "doc_001", hospitalId: "hos_001", employeeId: "EKM-DOC-001", userId: "doc_001", name: "Dr. Anil Kumar", role: "doctor", departmentId: "dep_001", speciality: "Cardiology", phone: "+91 98470 11111", email: "anil.kumar@gh-ernakulam.gov.in", status: "active", joinedAt: "2015-03-10" },
      { id: "doc_002", hospitalId: "hos_001", employeeId: "EKM-DOC-002", userId: "doc_002", name: "Dr. Geetha Nair", role: "doctor", departmentId: "dep_002", speciality: "General Medicine", phone: "+91 98470 22222", email: "geetha.nair@gh-ernakulam.gov.in", status: "active", joinedAt: "2012-07-02" },
      { id: "stf_001", hospitalId: "hos_001", employeeId: "EKM-REC-001", userId: "stf_001", name: "Radhika Menon", role: "receptionist", departmentId: undefined, phone: "+91 98470 81001", email: "radhika.menon@gh-ernakulam.gov.in", status: "active", joinedAt: "2019-04-01" },
      { id: "stf_002", hospitalId: "hos_001", employeeId: "EKM-NUR-002", name: "Sindhu Thomas", role: "nurse", departmentId: "dep_002", phone: "+91 98470 81002", email: "sindhu.thomas@gh-ernakulam.gov.in", status: "active", joinedAt: "2016-08-15" },
      { id: "stf_003", hospitalId: "hos_001", employeeId: "EKM-PHA-003", name: "Rajesh Pillai", role: "pharmacist", phone: "+91 98470 81003", email: "rajesh.pillai@gh-ernakulam.gov.in", status: "active", joinedAt: "2018-02-20" },
      { id: "stf_004", hospitalId: "hos_001", employeeId: "EKM-LAB-004", userId: "lab_001", name: "Deepa S", role: "lab_technician", phone: "+91 98470 81004", email: "deepa.s@gh-ernakulam.gov.in", status: "active", joinedAt: "2020-10-05" },
      { id: "stf_005", hospitalId: "hos_001", employeeId: "EKM-ACC-005", name: "Vinu K", role: "accountant", phone: "+91 98470 81005", email: "vinu.k@gh-ernakulam.gov.in", status: "active", joinedAt: "2017-12-11" },
    ],
    roleAssignments: [
      { id: "ra_001", userId: "doc_001", userName: "Dr. Anil Kumar", hospitalId: "hos_001", departmentId: "dep_001", role: "doctor", assignedAt: new Date().toISOString(), assignedBy: HOSPITAL_ADMIN.name },
      { id: "ra_002", userId: "stf_001", userName: "Radhika Menon", hospitalId: "hos_001", role: "receptionist", assignedAt: new Date().toISOString(), assignedBy: HOSPITAL_ADMIN.name },
    ],
    schedules: [
      {
        id: "sch_dep_001",
        hospitalId: "hos_001",
        departmentId: "dep_001",
        days: {
          mon: session("09:00", "13:00", [{ start: "10:45", end: "11:00" }]),
          tue: session("09:00", "13:00", [{ start: "10:45", end: "11:00" }]),
          wed: session("09:00", "13:00", [{ start: "10:45", end: "11:00" }]),
          thu: session("09:00", "13:00", [{ start: "10:45", end: "11:00" }]),
          fri: session("09:00", "13:00", [{ start: "10:45", end: "11:00" }]),
          sat: session("09:00", "12:00"),
          sun: null,
        },
        slotDurationMinutes: 10,
        maxAppointmentsPerDay: 60,
        doctorIds: ["doc_001"],
        updatedAt: new Date().toISOString(),
      },
      {
        id: "sch_dep_002",
        hospitalId: "hos_001",
        departmentId: "dep_002",
        days: {
          mon: session("09:00", "13:00"),
          tue: session("09:00", "13:00"),
          wed: session("09:00", "13:00"),
          thu: session("09:00", "13:00"),
          fri: session("09:00", "13:00"),
          sat: session("09:00", "12:00"),
          sun: null,
        },
        slotDurationMinutes: 10,
        maxAppointmentsPerDay: 80,
        doctorIds: ["doc_002"],
        updatedAt: new Date().toISOString(),
      },
      {
        id: "sch_dep_003",
        hospitalId: "hos_001",
        departmentId: "dep_003",
        days: {
          mon: session("09:30", "13:00"),
          tue: session("09:30", "13:00"),
          wed: session("09:30", "13:00"),
          thu: session("09:30", "13:00"),
          fri: session("09:30", "13:00"),
          sat: null,
          sun: null,
        },
        slotDurationMinutes: 15,
        maxAppointmentsPerDay: 40,
        doctorIds: [],
        updatedAt: new Date().toISOString(),
      },
      {
        id: "sch_dep_004",
        hospitalId: "hos_001",
        departmentId: "dep_004",
        days: {
          mon: session("09:00", "13:00", [{ start: "11:00", end: "11:20" }]),
          tue: session("09:00", "13:00", [{ start: "11:00", end: "11:20" }]),
          wed: session("09:00", "13:00", [{ start: "11:00", end: "11:20" }]),
          thu: session("09:00", "13:00", [{ start: "11:00", end: "11:20" }]),
          fri: session("09:00", "13:00", [{ start: "11:00", end: "11:20" }]),
          sat: session("09:00", "12:00"),
          sun: null,
        },
        slotDurationMinutes: 10,
        maxAppointmentsPerDay: 50,
        doctorIds: [],
        updatedAt: new Date().toISOString(),
      },
    ],
    exceptions: [
      {
        id: "exc_001",
        hospitalId: "hos_001",
        departmentId: "dep_003",
        date: today,
        type: "doctor_unavailable",
        reason: "Doctor deputed to district medical camp",
        status: "active",
        createdAt: new Date().toISOString(),
        createdBy: HOSPITAL_ADMIN.name,
      },
      {
        id: "exc_002",
        hospitalId: "hos_001",
        departmentId: "dep_001",
        opdId: "opd_002",
        date: daysAgoISO(3),
        type: "cancelled",
        reason: "Afternoon OPD cancelled — doctor unavailable",
        status: "resolved",
        createdAt: new Date().toISOString(),
        createdBy: HOSPITAL_ADMIN.name,
      },
    ],
    queueConfigs: [
      { departmentId: "dep_001", tokenPrefix: "A", priorityEnabled: true, emergencySeparateQueue: true },
      { departmentId: "dep_002", tokenPrefix: "G", priorityEnabled: true, emergencySeparateQueue: true },
      { departmentId: "dep_003", tokenPrefix: "O", priorityEnabled: false, emergencySeparateQueue: true },
      { departmentId: "dep_004", tokenPrefix: "P", priorityEnabled: true, emergencySeparateQueue: false },
    ],
    tokenConfigs: [{ hospitalId: "hos_001", dailyReset: false, format: "PREFIX-NNN", maxDailyTokens: 200 }],
    services: [
      { id: "svc_001", hospitalId: "hos_001", name: "OPD Consultation", code: "OPD-CONS", status: "active", availability: "Mon–Sat · 09:00–17:00" },
      { id: "svc_002", hospitalId: "hos_001", name: "Laboratory", code: "LAB", status: "active", availability: "Mon–Sat · 08:00–14:00" },
      { id: "svc_003", hospitalId: "hos_001", name: "X-Ray", code: "XRAY", departmentId: "dep_003", status: "active", availability: "Mon–Fri · 09:00–15:00" },
      { id: "svc_004", hospitalId: "hos_001", name: "Ultrasound", code: "USG", status: "active", availability: "Tue & Fri · 10:00–13:00" },
      { id: "svc_005", hospitalId: "hos_001", name: "Pharmacy", code: "PHARM", status: "active", availability: "Mon–Sat · 09:00–17:00" },
      { id: "svc_006", hospitalId: "hos_001", name: "ECG", code: "ECG", departmentId: "dep_001", status: "active", availability: "Mon–Sat · 09:00–13:00" },
    ],
    audit: [
      { id: "aud_seed_1", at: `${today}T10:42:00`, actorId: "adm_001", actorName: HOSPITAL_ADMIN.name, actorRole: "Hospital Admin", action: "schedule_updated", targetType: "department", targetId: "dep_001", summary: "OPD schedule updated for Cardiology" },
      { id: "aud_seed_2", at: `${today}T10:38:00`, actorId: "adm_001", actorName: HOSPITAL_ADMIN.name, actorRole: "Hospital Admin", action: "staff_updated", targetType: "staff", targetId: "doc_001", summary: "Dr. Anil Kumar assigned to Cardiology" },
      { id: "aud_seed_3", at: `${today}T10:15:00`, actorId: "adm_001", actorName: HOSPITAL_ADMIN.name, actorRole: "Hospital Admin", action: "queue_config_updated", targetType: "queue_config", targetId: "dep_002", summary: "Queue configuration changed for General Medicine" },
    ],
  };
}

let store: OpsStore | null = null;

function ensureLoaded(): OpsStore {
  if (store) return store;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      store = JSON.parse(raw) as OpsStore;
      return store;
    }
  } catch {
    store = null;
  }
  store = seedStore();
  saveStore();
  return store;
}

function saveStore(): void {
  if (!store) return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // storage unavailable
  }
}

export function getTokenPrefixSync(departmentId: string): string | null {
  const s = ensureLoaded();
  return s.queueConfigs.find((q) => q.departmentId === departmentId)?.tokenPrefix ?? null;
}

export function getTokenConfigSync(hospitalId: string): TokenConfig | null {
  const s = ensureLoaded();
  return s.tokenConfigs.find((t) => t.hospitalId === hospitalId) ?? null;
}

let auditSeq = 0;

function pushAudit(
  action: OperationalAuditAction,
  targetType: string,
  summary: string,
  actor?: AuditActor,
  targetId?: string
): void {
  const s = ensureLoaded();
  auditSeq += 1;
  const resolved: AuditActor = actor ?? {
    id: HOSPITAL_ADMIN.id,
    name: HOSPITAL_ADMIN.name,
    role: "Hospital Admin",
  };
  s.audit.unshift({
    id: `aud_${Date.now()}_${auditSeq}`,
    at: new Date().toISOString(),
    actorId: resolved.id,
    actorName: resolved.name,
    actorRole: resolved.role,
    action,
    targetType,
    targetId,
    summary,
  });
  if (s.audit.length > 500) s.audit.length = 500;
  saveStore();
}

function shiftMatches(startTime: string, shift: DashboardFilters["shift"]): boolean {
  if (shift === "all") return true;
  const hour = Number.parseInt(startTime.split(":")[0] ?? "0", 10);
  if (shift === "morning") return hour < 12;
  return hour >= 12;
}

function departmentSummaries(hospitalId: string, filters: DashboardFilters): DepartmentOpsSummary[] {
  const departments = listDepartments(hospitalId);
  const opds = listOpdsByHospital(hospitalId);
  return departments
    .filter((d) => !filters.departmentId || d.id === filters.departmentId)
    .map((department) => {
      const deptOpds = opds.filter(
        (o) => o.departmentId === department.id && shiftMatches(o.startTime, filters.shift)
      );
      let patients = 0;
      let completed = 0;
      let waiting = 0;
      let cancelled = 0;
      for (const opd of deptOpds) {
        const queue = listQueue(opd.id);
        patients += queue.length;
        completed += queue.filter((q) => q.status === "completed").length;
        waiting += queue.filter((q) => q.status === "waiting" || q.status === "called").length;
        cancelled += queue.filter((q) => q.status === "cancelled" || q.status === "no_show").length;
      }
      return {
        departmentId: department.id,
        departmentName: department.name,
        patients,
        completed,
        waiting,
        cancelled,
      };
    });
}

async function buildWorkload(hospitalId: string): Promise<StaffWorkloadRow[]> {
  const doctors = listDoctorsByHospital(hospitalId);
  const encounters = listAllEncounters().filter((e) => e.hospitalId === hospitalId);
  return doctors.map((doctor) => {
    const own = encounters.filter((e) => e.doctorId === doctor.id);
    const waiting = doctor.opdIds.reduce((sum, opdId) => sum + countWaitingByOpd(opdId), 0);
    return {
      doctorId: doctor.id,
      doctorName: doctor.name,
      departmentName: getDepartment(doctor.departmentId)?.name ?? "",
      patients: own.length + waiting,
      completed: own.filter((e) => e.status === "completed").length,
      waiting,
    };
  });
}

async function buildAlerts(hospitalId: string): Promise<OperationalAlert[]> {
  const settings = await adminService.getSettings(hospitalId);
  const alerts: OperationalAlert[] = [];
  const departments = listDepartments(hospitalId);

  for (const opd of listOpdsByHospital(hospitalId)) {
    const waiting = countWaitingByOpd(opd.id);
    if (opd.status === "paused") {
      alerts.push({
        id: `alert_pause_${opd.id}`,
        type: "opd_cancelled",
        severity: "warning",
        title: `${getDepartment(opd.departmentId)?.name ?? "OPD"} paused`,
        detail: opd.statusReason ? `Reason: ${opd.statusReason}` : "OPD temporarily paused.",
        departmentName: getDepartment(opd.departmentId)?.name,
      });
    }
    if (waiting >= settings.queueHealthThresholds.warning) {
      const critical = waiting >= settings.queueHealthThresholds.critical;
      alerts.push({
        id: `alert_delay_${opd.id}`,
        type: "queue_delay",
        severity: critical ? "critical" : "warning",
        title: `${getDepartment(opd.departmentId)?.name ?? "OPD"} queue delay`,
        detail: `Average waiting time: ~${Math.max(waiting, 1) * AVG_CONSULTATION_MINUTES} minutes · ${waiting} waiting`,
        departmentName: getDepartment(opd.departmentId)?.name,
      });
    }
  }

  const orders = await diagnosticsService.listAll();
  const pendingLab = orders.filter(
    (o) =>
      o.hospitalId === hospitalId &&
      (o.status === "ordered" || o.status === "sample_collected" || o.status === "processing")
  ).length;
  if (pendingLab >= LAB_BACKLOG_THRESHOLD) {
    alerts.push({
      id: "alert_lab_backlog",
      type: "lab_backlog",
      severity: "warning",
      title: "Laboratory backlog",
      detail: `${pendingLab} orders pending collection or processing.`,
    });
  }

  const today = todayISO();
  for (const exc of ensureLoaded().exceptions) {
    if (exc.hospitalId !== hospitalId || exc.status !== "active" || exc.date !== today) continue;
    const deptName = getDepartment(exc.departmentId)?.name ?? "Department";
    if (exc.type === "doctor_unavailable") {
      alerts.push({
        id: `alert_exc_${exc.id}`,
        type: "doctor_unavailable",
        severity: "warning",
        title: "Doctor unavailable",
        detail: `Today's ${deptName} schedule affected. ${exc.reason}`,
        departmentName: deptName,
      });
    } else if (exc.type === "cancelled" || exc.type === "emergency_closure") {
      alerts.push({
        id: `alert_exc_${exc.id}`,
        type: "opd_cancelled",
        severity: "critical",
        title: `${deptName} OPD ${exc.type === "cancelled" ? "cancelled" : "closed"}`,
        detail: exc.reason,
        departmentName: deptName,
      });
    }
  }

  void departments;
  return alerts;
}

function rangeStartISO(range: DashboardFilters["dateRange"], reference: string): string {
  if (range === "today") return reference;
  const base = new Date(`${reference}T00:00:00`);
  const days = range === "7d" ? 6 : 29;
  base.setDate(base.getDate() - days);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(
    base.getDate()
  ).padStart(2, "0")}`;
}

function periodLabel(reference: string): string {
  return new Date(`${reference}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const hospitalOpsService = {
  async getHospitalProfile(hospitalId: string): Promise<HospitalProfile | null> {
    await delay();
    return ensureLoaded().hospitalProfiles.find((h) => h.id === hospitalId) ?? null;
  },

  async listDepartmentConfigs(hospitalId: string) {
    await delay();
    return ensureLoaded().departmentConfigs.filter((d) => d.hospitalId === hospitalId);
  },

  async saveDepartmentConfig(
    config: DepartmentConfig,
    actor?: AuditActor
  ): Promise<DepartmentConfig> {
    await delay();
    const s = ensureLoaded();
    const existing = s.departmentConfigs.find((d) => d.id === config.id);
    if (existing) {
      Object.assign(existing, config);
    } else {
      s.departmentConfigs.push(config);
    }
    saveStore();
    pushAudit("department_updated", "department", `Department ${config.name} updated`, actor, config.id);
    return config;
  },

  async listStaffProfiles(hospitalId: string): Promise<StaffProfile[]> {
    await delay();
    return ensureLoaded().staffProfiles.filter((p) => p.hospitalId === hospitalId);
  },

  async saveStaffProfile(profile: StaffProfile, actor?: AuditActor): Promise<StaffProfile> {
    await delay();
    const s = ensureLoaded();
    const existing = s.staffProfiles.find((p) => p.id === profile.id);
    if (existing) {
      Object.assign(existing, profile);
      pushAudit("staff_updated", "staff", `${profile.name} updated`, actor, profile.id);
    } else {
      s.staffProfiles.push(profile);
      pushAudit("staff_added", "staff", `${profile.name} added as ${profile.role.replace("_", " ")}`, actor, profile.id);
    }
    saveStore();
    return profile;
  },

  async nextEmployeeId(hospitalId: string, role: OpsStaffRole): Promise<string> {
    await delay();
    const s = ensureLoaded();
    const prefixMap: Record<string, string> = {
      doctor: "DOC",
      receptionist: "REC",
      nurse: "NUR",
      pharmacist: "PHA",
      lab_technician: "LAB",
      accountant: "ACC",
      administrator: "ADM",
    };
    const prefix = prefixMap[role] ?? "GEN";
    const hospitalCode =
      s.hospitalProfiles.find((h) => h.id === hospitalId)?.code.replace(/[^A-Z]/g, "").slice(0, 3) ?? "GEN";
    const seq = s.staffProfiles.filter((p) => p.employeeId.includes(`-${prefix}-`)).length + 1;
    return `${hospitalCode}-${prefix}-${String(seq).padStart(3, "0")}`;
  },

  async listRoleAssignments(hospitalId: string): Promise<RoleAssignment[]> {
    await delay();
    return ensureLoaded().roleAssignments.filter((r) => r.hospitalId === hospitalId);
  },

  async assignRole(
    input: { userId: string; userName: string; departmentId?: string; role: AssignableUserRole },
    hospitalId: string,
    actor?: AuditActor
  ): Promise<RoleAssignment> {
    await delay();
    const s = ensureLoaded();
    const assignment: RoleAssignment = {
      id: `ra_${Date.now()}`,
      userId: input.userId,
      userName: input.userName,
      hospitalId,
      departmentId: input.departmentId,
      role: input.role,
      assignedAt: new Date().toISOString(),
      assignedBy: actor?.name ?? HOSPITAL_ADMIN.name,
    };
    s.roleAssignments.unshift(assignment);
    saveStore();
    pushAudit("role_assigned", "user", `${input.userName} assigned role ${input.role.replace("_", " ")}`, actor, input.userId);
    return assignment;
  },

  async removeRoleAssignment(id: string, actor?: AuditActor): Promise<void> {
    await delay();
    const s = ensureLoaded();
    const assignment = s.roleAssignments.find((r) => r.id === id);
    s.roleAssignments = s.roleAssignments.filter((r) => r.id !== id);
    saveStore();
    if (assignment) {
      pushAudit("role_removed", "user", `${assignment.userName} role assignment removed`, actor, assignment.userId);
    }
  },

  async getWeeklySchedule(departmentId: string): Promise<OpdWeeklySchedule | null> {
    await delay();
    return ensureLoaded().schedules.find((s) => s.departmentId === departmentId) ?? null;
  },

  async saveWeeklySchedule(schedule: OpdWeeklySchedule, actor?: AuditActor): Promise<OpdWeeklySchedule> {
    await delay();
    const s = ensureLoaded();
    const existing = s.schedules.find((x) => x.departmentId === schedule.departmentId);
    const saved: OpdWeeklySchedule = { ...schedule, updatedAt: new Date().toISOString() };
    if (existing) {
      Object.assign(existing, saved);
    } else {
      s.schedules.push(saved);
    }
    saveStore();

    const configs = await appointmentService.listScheduleConfigs();
    const config = configs.find((c) => c.departmentId === schedule.departmentId && !c.doctorId);
    if (config) {
      const synced: ScheduleConfig = {
        ...config,
        workdays: Object.fromEntries(
          WEEKDAYS.map(({ value }) => {
            const day = schedule.days[value];
            return [value, day ? { open: day.open, close: day.close } : ("closed" as const)];
          })
        ) as ScheduleConfig["workdays"],
        slotDurationMinutes: schedule.slotDurationMinutes,
      };
      await appointmentService.saveScheduleConfig(synced);
    }

    const deptName = getDepartment(schedule.departmentId)?.name ?? schedule.departmentId;
    pushAudit("schedule_updated", "department", `OPD schedule updated for ${deptName}`, actor, schedule.departmentId);
    return saved;
  },

  async listExceptions(hospitalId: string, includeResolved = true): Promise<ScheduleException[]> {
    await delay();
    const items = ensureLoaded().exceptions.filter((e) => e.hospitalId === hospitalId);
    return includeResolved ? items : items.filter((e) => e.status === "active");
  },

  async createException(
    input: {
      departmentId: string;
      opdId?: string;
      doctorId?: string;
      date: string;
      type: ScheduleExceptionType;
      reason: string;
      customOpen?: string;
      customClose?: string;
    },
    hospitalId: string,
    actor?: AuditActor
  ): Promise<ScheduleException> {
    await delay();
    const s = ensureLoaded();
    const exception: ScheduleException = {
      id: `exc_${Date.now()}`,
      hospitalId,
      ...input,
      status: "active",
      createdAt: new Date().toISOString(),
      createdBy: actor?.name ?? HOSPITAL_ADMIN.name,
    };
    s.exceptions.unshift(exception);
    saveStore();
    const deptName = getDepartment(input.departmentId)?.name ?? input.departmentId;
    pushAudit(
      "exception_created",
      "schedule_exception",
      `${deptName} · ${input.date}: ${input.type.replace("_", " ")} (${input.reason})`,
      actor,
      exception.id
    );
    return exception;
  },

  async resolveException(id: string, actor?: AuditActor): Promise<void> {
    await delay();
    const s = ensureLoaded();
    const exception = s.exceptions.find((e) => e.id === id);
    if (exception) {
      exception.status = "resolved";
      saveStore();
      const deptName = getDepartment(exception.departmentId)?.name ?? exception.departmentId;
      pushAudit("exception_resolved", "schedule_exception", `${deptName} · ${exception.date} exception resolved`, actor, id);
    }
  },

  async getAffectedAppointments(exception: ScheduleException): Promise<AffectedAppointment[]> {
    await delay();
    const all = await appointmentService.listAll();
    return all
      .filter(
        (a) =>
          a.hospitalId === exception.hospitalId &&
          a.departmentId === exception.departmentId &&
          a.scheduledDate === exception.date &&
          (!exception.doctorId || a.doctorId === exception.doctorId) &&
          (a.status === "scheduled" || a.status === "confirmed")
      )
      .map((a) => ({
        appointmentId: a.id,
        patientName: getPatient(a.patientId)?.name ?? a.patientId,
        scheduledTime: a.scheduledTime,
        type: a.type.replace("_", " "),
        status: a.status,
        doctorName: a.doctorId,
      }));
  },

  async listQueueConfigs(hospitalId: string): Promise<DepartmentQueueConfig[]> {
    await delay();
    const s = ensureLoaded();
    const configured = s.queueConfigs.filter((q) =>
      getDepartment(q.departmentId)?.hospitalId === hospitalId
    );
    const missing = listDepartments(hospitalId)
      .filter((d) => !configured.some((q) => q.departmentId === d.id))
      .map((d) => ({
        departmentId: d.id,
        tokenPrefix: d.name.charAt(0).toUpperCase(),
        priorityEnabled: true,
        emergencySeparateQueue: true,
      }));
    return [...configured, ...missing];
  },

  async saveQueueConfig(config: DepartmentQueueConfig, actor?: AuditActor): Promise<DepartmentQueueConfig> {
    await delay();
    const normalized = config.tokenPrefix.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!normalized || normalized.length > 3) {
      throw new Error("Token prefix must be 1–3 letters or digits.");
    }
    const s = ensureLoaded();
    const existing = s.queueConfigs.find((q) => q.departmentId === config.departmentId);
    const saved = { ...config, tokenPrefix: normalized };
    if (existing) {
      Object.assign(existing, saved);
    } else {
      s.queueConfigs.push(saved);
    }
    saveStore();
    const deptName = getDepartment(config.departmentId)?.name ?? config.departmentId;
    pushAudit("queue_config_updated", "queue_config", `Queue configuration changed for ${deptName}`, actor, config.departmentId);
    return saved;
  },

  async getTokenConfig(hospitalId: string): Promise<TokenConfig> {
    await delay();
    return (
      ensureLoaded().tokenConfigs.find((t) => t.hospitalId === hospitalId) ?? {
        hospitalId,
        dailyReset: false,
        format: "PREFIX-NNN",
        maxDailyTokens: 200,
      }
    );
  },

  async saveTokenConfig(config: TokenConfig, actor?: AuditActor): Promise<TokenConfig> {
    await delay();
    if (!Number.isFinite(config.maxDailyTokens) || config.maxDailyTokens < 1 || config.maxDailyTokens > 999) {
      throw new Error("Maximum daily tokens must be between 1 and 999.");
    }
    const s = ensureLoaded();
    const existing = s.tokenConfigs.find((t) => t.hospitalId === config.hospitalId);
    if (existing) {
      Object.assign(existing, config);
    } else {
      s.tokenConfigs.push(config);
    }
    saveStore();
    pushAudit("token_config_updated", "token_config", `Token configuration updated (max ${config.maxDailyTokens}/day)`, actor, config.hospitalId);
    return config;
  },

  async listServices(hospitalId: string): Promise<HospitalServiceEntry[]> {
    await delay();
    return ensureLoaded().services.filter((s) => s.hospitalId === hospitalId);
  },

  async saveService(entry: HospitalServiceEntry, actor?: AuditActor): Promise<HospitalServiceEntry> {
    await delay();
    const s = ensureLoaded();
    const existing = s.services.find((x) => x.id === entry.id);
    if (existing) {
      Object.assign(existing, entry);
    } else {
      s.services.push(entry);
    }
    saveStore();
    pushAudit("service_updated", "service", `Service ${entry.name} updated`, actor, entry.id);
    return entry;
  },

  async toggleServiceStatus(id: string, actor?: AuditActor): Promise<HospitalServiceEntry | null> {
    await delay();
    const s = ensureLoaded();
    const entry = s.services.find((x) => x.id === id);
    if (!entry) return null;
    entry.status = entry.status === "active" ? "inactive" : "active";
    saveStore();
    pushAudit("service_updated", "service", `Service ${entry.name} set to ${entry.status}`, actor, id);
    return entry;
  },

  async getDashboard(hospitalId: string, filters: DashboardFilters): Promise<OpsDashboardData> {
    await delay();
    const registrations = await registrationService.recentRegistrations();
    const reference =
      registrations.length > 0
        ? registrations[0].createdAt.slice(0, 10)
        : todayISO();

    const opds = listOpdsByHospital(hospitalId).filter(
      (o) =>
        shiftMatches(o.startTime, filters.shift) &&
        (!filters.departmentId || o.departmentId === filters.departmentId)
    );

    let patientsToday = 0;
    let completedOpd = 0;
    let waiting = 0;
    let emergency = 0;
    for (const opd of opds) {
      const queue = listQueue(opd.id);
      patientsToday += queue.length;
      completedOpd += queue.filter((q) => q.status === "completed").length;
      waiting += queue.filter((q) => q.status === "waiting" || q.status === "called").length;
      emergency += queue.filter(
        (q) => q.priority === "emergency" && !["completed", "cancelled"].includes(q.status)
      ).length;
    }

    const start = rangeStartISO(filters.dateRange, reference);
    const appointments = (await appointmentService.listAll()).filter(
      (a) =>
        a.hospitalId === hospitalId &&
        a.status !== "cancelled" &&
        a.status !== "rescheduled" &&
        a.scheduledDate >= start &&
        a.scheduledDate <= reference &&
        (!filters.departmentId || a.departmentId === filters.departmentId)
    );

    const departments = departmentSummaries(hospitalId, filters);
    const workload = (await buildWorkload(hospitalId)).filter(
      (w) => !filters.departmentId || w.departmentName === getDepartment(filters.departmentId)?.name
    );
    const alerts = await buildAlerts(hospitalId);

    return {
      overview: {
        patientsToday: patientsToday || countTokensByHospital(hospitalId),
        appointmentsToday: appointments.length,
        completedOpd: completedOpd || countCompletedTokensByHospital(hospitalId),
        waiting: waiting || countWaitingByHospital(hospitalId),
        emergency,
      },
      departments,
      alerts,
      workload,
    };
  },

  async getWorkload(hospitalId: string): Promise<StaffWorkloadRow[]> {
    await delay();
    return buildWorkload(hospitalId);
  },

  async getAlerts(hospitalId: string): Promise<OperationalAlert[]> {
    await delay();
    return buildAlerts(hospitalId);
  },

  async getReport(hospitalId: string, type: ReportType): Promise<OpsReport> {
    await delay();
    const registrations = await registrationService.recentRegistrations();
    const reference =
      registrations.length > 0 ? registrations[0].createdAt.slice(0, 10) : todayISO();
    const period = periodLabel(reference);
    const departments = listDepartments(hospitalId);
    const opds = listOpdsByHospital(hospitalId);

    const deptRows = () =>
      departments.map((department) => {
        const deptOpds = opds.filter((o) => o.departmentId === department.id);
        let tokens = 0;
        let completed = 0;
        let waiting = 0;
        let cancelled = 0;
        for (const opd of deptOpds) {
          const queue = listQueue(opd.id);
          tokens += queue.length;
          completed += queue.filter((q) => q.status === "completed").length;
          waiting += queue.filter((q) => q.status === "waiting" || q.status === "called").length;
          cancelled += queue.filter((q) => q.status === "cancelled" || q.status === "no_show").length;
        }
        return { department, tokens, completed, waiting, cancelled };
      });

    switch (type) {
      case "daily_opd": {
        const rows = deptRows();
        const totals = rows.reduce(
          (acc, r) => ({
            tokens: acc.tokens + r.tokens,
            completed: acc.completed + r.completed,
            waiting: acc.waiting + r.waiting,
            cancelled: acc.cancelled + r.cancelled,
          }),
          { tokens: 0, completed: 0, waiting: 0, cancelled: 0 }
        );
        return {
          type,
          title: "Daily OPD Report",
          period,
          summary: [
            { label: "Tokens Issued", value: totals.tokens },
            { label: "Completed", value: totals.completed },
            { label: "Waiting", value: totals.waiting },
            { label: "Cancelled / No-show", value: totals.cancelled },
          ],
          table: {
            columns: ["Department", "Tokens", "Completed", "Waiting", "Cancelled"],
            rows: rows.map((r) => [r.department.name, r.tokens, r.completed, r.waiting, r.cancelled]),
          },
        };
      }

      case "department_performance": {
        const rows = deptRows();
        return {
          type,
          title: "Department Performance",
          period,
          summary: [
            { label: "Departments", value: rows.length },
            { label: "Best Completion", value:
              rows.length > 0
                ? rows
                    .map((r) => ({ name: r.department.name, rate: r.tokens ? Math.round((r.completed / r.tokens) * 100) : 0 }))
                    .sort((a, b) => b.rate - a.rate)[0].name
                : "—" },
          ],
          table: {
            columns: ["Department", "Tokens", "Completed", "Completion %", "Est. Avg Wait (min)"],
            rows: rows.map((r) => [
              r.department.name,
              r.tokens,
              r.completed,
              r.tokens ? Math.round((r.completed / r.tokens) * 100) : 0,
              Math.max(r.waiting, 0) * AVG_CONSULTATION_MINUTES,
            ]),
          },
        };
      }

      case "appointment_report": {
        const all = (await appointmentService.listAll()).filter((a) => a.hospitalId === hospitalId);
        const byStatus = new Map<string, number>();
        const byType = new Map<string, number>();
        for (const a of all) {
          byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);
          byType.set(a.type, (byType.get(a.type) ?? 0) + 1);
        }
        return {
          type,
          title: "Appointment Report",
          period,
          summary: [
            { label: "Total Appointments", value: all.length },
            { label: "Checked In / Completed", value: (byStatus.get("checked_in") ?? 0) + (byStatus.get("completed") ?? 0) },
            { label: "Cancelled", value: byStatus.get("cancelled") ?? 0 },
            { label: "No-show", value: byStatus.get("no_show") ?? 0 },
          ],
          table: {
            columns: ["Appointment Type", "Count"],
            rows: [...byType.entries()].map(([t, n]) => [t.replace("_", " "), n]),
          },
        };
      }

      case "queue_report": {
        const settings = await adminService.getSettings(hospitalId);
        const rows = opds.map((opd) => {
          const queue = listQueue(opd.id);
          const waiting = queue.filter((q) => q.status === "waiting").length;
          return {
            opd,
            departmentName: getDepartment(opd.departmentId)?.name ?? "",
            nowServing: opd.currentlyServing ?? "—",
            waiting,
            inConsultation: queue.filter((q) => q.status === "in_consultation").length,
            completed: queue.filter((q) => q.status === "completed").length,
            health: queueHealthFor(waiting, settings),
          };
        });
        return {
          type,
          title: "Queue Report",
          period,
          summary: [
            { label: "OPDs", value: rows.length },
            { label: "Waiting Now", value: rows.reduce((s, r) => s + r.waiting, 0) },
            { label: "In Consultation", value: rows.reduce((s, r) => s + r.inConsultation, 0) },
            { label: "Completed", value: rows.reduce((s, r) => s + r.completed, 0) },
          ],
          table: {
            columns: ["OPD", "Department", "Now Serving", "Waiting", "In Consultation", "Completed", "Health"],
            rows: rows.map((r) => [
              r.opd.name,
              r.departmentName,
              r.nowServing,
              r.waiting,
              r.inConsultation,
              r.completed,
              r.health,
            ]),
          },
        };
      }

      case "patient_volume": {
        const days: Array<{ date: string; count: number }> = [];
        for (let i = 6; i >= 0; i -= 1) {
          const date = (() => {
            const base = new Date(`${reference}T00:00:00`);
            base.setDate(base.getDate() - i);
            return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(
              base.getDate()
            ).padStart(2, "0")}`;
          })();
          days.push({ date, count: 0 });
        }
        for (const record of registrations) {
          const date = record.createdAt.slice(0, 10);
          const bucket = days.find((d) => d.date === date);
          if (bucket) bucket.count += 1;
        }
        return {
          type,
          title: "Patient Volume",
          period: `Last 7 days · ending ${period}`,
          summary: [
            { label: "Registrations (7 days)", value: days.reduce((s, d) => s + d.count, 0) },
            { label: "Busiest Day", value: days.reduce((best, d) => (d.count > best.count ? d : best), days[0]).date },
          ],
          table: {
            columns: ["Date", "Registrations"],
            rows: days.map((d) => [d.date, d.count]),
          },
        };
      }

      case "doctor_workload": {
        const rows = await buildWorkload(hospitalId);
        return {
          type,
          title: "Doctor Workload",
          period,
          summary: [
            { label: "Doctors", value: rows.length },
            { label: "Patients Seen", value: rows.reduce((s, r) => s + r.completed, 0) },
            { label: "Currently Waiting", value: rows.reduce((s, r) => s + r.waiting, 0) },
          ],
          table: {
            columns: ["Doctor", "Department", "Patients", "Completed", "Waiting"],
            rows: rows.map((r) => [r.doctorName, r.departmentName, r.patients, r.completed, r.waiting]),
          },
        };
      }

      case "laboratory_volume": {
        const orders = (await diagnosticsService.listAll()).filter((o) => o.hospitalId === hospitalId);
        const byStatus = new Map<string, number>();
        const byTest = new Map<string, number>();
        for (const order of orders) {
          byStatus.set(order.status, (byStatus.get(order.status) ?? 0) + 1);
          for (const item of order.items) {
            byTest.set(item.testName, (byTest.get(item.testName) ?? 0) + 1);
          }
        }
        return {
          type,
          title: "Laboratory Volume",
          period,
          summary: [
            { label: "Orders", value: orders.length },
            { label: "Pending", value: (byStatus.get("ordered") ?? 0) + (byStatus.get("sample_collected") ?? 0) + (byStatus.get("processing") ?? 0) },
            { label: "Completed", value: byStatus.get("completed") ?? 0 },
          ],
          table: {
            columns: ["Test", "Orders"],
            rows: [...byTest.entries()].sort((a, b) => b[1] - a[1]).map(([test, n]) => [test, n]),
          },
        };
      }

      case "pharmacy_volume":
      default: {
        const prescriptions = (await prescriptionService.listAll()).filter(
          (p) => p.workflowStatus === "finalized"
        );
        const dispensed = prescriptions.filter((p) => p.status === "dispensed").length;
        const pending = prescriptions.filter((p) => p.status === "sent_to_pharmacy").length;
        return {
          type: "pharmacy_volume",
          title: "Pharmacy Volume",
          period,
          summary: [
            { label: "Prescriptions", value: prescriptions.length },
            { label: "Dispensed", value: dispensed },
            { label: "Awaiting Dispatch", value: pending },
          ],
          table: {
            columns: ["Metric", "Count"],
            rows: [
              ["Finalized prescriptions", prescriptions.length],
              ["Dispensed", dispensed],
              ["Awaiting dispatch", pending],
              ["Partially dispensed", prescriptions.filter((p) => !["dispensed", "sent_to_pharmacy"].includes(p.status)).length],
            ],
          },
        };
      }
    }
  },

  async listAudit(
    hospitalId: string,
    filters: { action?: OperationalAuditAction | ""; query?: string } = {}
  ): Promise<OperationalAuditEvent[]> {
    await delay();
    let events = ensureLoaded().audit;
    void hospitalId;
    if (filters.action) events = events.filter((e) => e.action === filters.action);
    if (filters.query) {
      const q = filters.query.toLowerCase();
      events = events.filter(
        (e) => e.summary.toLowerCase().includes(q) || e.actorName.toLowerCase().includes(q)
      );
    }
    return events;
  },

  async logOpdStatusChange(
    opdName: string,
    status: "open" | "paused" | "closed",
    actor?: AuditActor,
    reason?: string
  ): Promise<void> {
    await delay();
    pushAudit(
      "opd_status_changed",
      "opd",
      `${opdName} set to ${status}${reason ? ` (${reason})` : ""}`,
      actor
    );
  },
};

import {
  opsCreateDepartment,
  opsListServices,
  opsListDepartmentConfigs,
  opsSaveDepartmentConfig,
  opsSaveService,
  opsToggleServiceStatus,
  opsSetDepartmentStatus,
  opsListRooms,
  opsSaveRoom,
  opsSetRoomStatus,
  opsListShifts,
  opsSaveShift,
  opsSetShiftStatus,
  opsDoctorAvailability,
  type OpsDepartmentConfig,
  type OpsDepartmentConfigInput,
  type DayAvailability,
} from "@/server/actions/hospital-ops";
import {
  opsListSessions,
  opsGetSession,
  opsListSessionQueue,
  opsOpenSession,
  opsActivateSession,
  opsPauseSession,
  opsResumeSession,
  opsCompleteSession,
  opsCancelSession,
} from "@/server/actions/opd-sessions";
import {
  opsCreateClosure,
  opsListClosures,
  opsRescheduleAffected,
  opsCancelAffected,
} from "@/server/actions/closures";
import { opsListConfigVersions } from "@/server/actions/hospital-ops";
import {
  opsHospitalDashboard,
  opsOperationalAlerts,
  type HospitalDashboard,
  type OperationalAlert,
} from "@/server/actions/hospital-dashboard";
import {
  opsListStaff,
  opsListAssignments,
  opsCreateAssignment,
  opsEndAssignment,
  opsRequestLeave,
  opsListLeaves,
  opsReviewLeave,
  opsCancelLeave,
  opsLeaveImpact,
  type OpsStaffRow,
} from "@/server/actions/staff-ops";
import type { HospitalServiceEntry } from "@/services/hospital-ops/types";
import type { ConfigVersion, Room, ShiftTemplate, StaffAssignment, StaffLeave } from "@/types";

function serviceToEntry(s: Awaited<ReturnType<typeof opsListServices>>[number]): HospitalServiceEntry {
  return {
    id: s.id,
    hospitalId: s.hospitalId,
    name: s.name,
    code: s.code,
    departmentId: s.departmentId ?? undefined,
    status: s.status,
    availability: s.description ?? "",
  };
}

function entryToInput(entry: HospitalServiceEntry) {
  return {
    id: entry.id || undefined,
    hospitalId: entry.hospitalId,
    name: entry.name,
    code: entry.code,
    departmentId: entry.departmentId ?? null,
    description: entry.availability || undefined,
    status: entry.status,
  };
}

export const hospitalOpsServerApi = {
  async listRooms(hospitalId: string): Promise<Room[]> {
    try {
      return await opsListRooms(hospitalId);
    } catch {
      return [];
    }
  },

  async saveRoom(room: Parameters<typeof opsSaveRoom>[0]): Promise<Room | null> {
    return opsSaveRoom(room);
  },

  async setRoomStatus(id: string, status: Room["status"]): Promise<Room | null> {
    return opsSetRoomStatus(id, status);
  },

  async listServices(hospitalId: string): Promise<HospitalServiceEntry[]> {
    try {
      const services = await opsListServices(hospitalId);
      return services.map(serviceToEntry);
    } catch {
      return [];
    }
  },

  async saveService(entry: HospitalServiceEntry): Promise<HospitalServiceEntry | null> {
    const saved = await opsSaveService(entryToInput(entry));
    return saved ? serviceToEntry(saved) : null;
  },

  async toggleServiceStatus(id: string): Promise<HospitalServiceEntry | null> {
    const updated = await opsToggleServiceStatus(id);
    return updated ? serviceToEntry(updated) : null;
  },

  async listDepartmentConfigs(hospitalId: string): Promise<OpsDepartmentConfig[]> {
    try {
      return await opsListDepartmentConfigs(hospitalId);
    } catch {
      return [];
    }
  },

  async saveDepartmentConfig(config: OpsDepartmentConfigInput): Promise<OpsDepartmentConfig> {
    return opsSaveDepartmentConfig(config);
  },

  async createDepartment(hospitalId: string, name: string): Promise<void> {
    await opsCreateDepartment(hospitalId, { name });
  },

  async setDepartmentStatus(departmentId: string, status: "active" | "inactive"): Promise<void> {
    await opsSetDepartmentStatus(departmentId, status);
  },

  /* ── Staff & leave (WS3) ── */

  async listStaff(hospitalId: string): Promise<OpsStaffRow[]> {
    try {
      return await opsListStaff(hospitalId);
    } catch {
      return [];
    }
  },

  async listAssignments(staffId: string): Promise<StaffAssignment[]> {
    try {
      return await opsListAssignments(staffId);
    } catch {
      return [];
    }
  },

  createAssignment: (
    input: {
      hospitalId: string;
      staffId: string;
      departmentId?: string | null;
      role: string;
      startDate: string;
      endDate?: string | null;
    }
  ): Promise<StaffAssignment> => opsCreateAssignment(input),

  endAssignment: (assignmentId: string): Promise<void> => opsEndAssignment(assignmentId),

  requestLeave: (
    input: { hospitalId: string; staffId?: string; fromDate: string; toDate: string; reason: string }
  ): Promise<StaffLeave> => opsRequestLeave(input),

  listLeaves: (
    hospitalId: string,
    status?: StaffLeave["status"]
  ): Promise<Array<StaffLeave & { staffName: string }>> =>
    opsListLeaves(hospitalId, status).catch(() => []),

  reviewLeave: (leaveId: string, approve: boolean): Promise<void> => opsReviewLeave(leaveId, approve),

  cancelLeave: (leaveId: string): Promise<void> => opsCancelLeave(leaveId),

  leaveImpact: (leaveId: string) => opsLeaveImpact(leaveId),

  /* ── Shifts & availability (WS4) ── */

  async listShifts(hospitalId: string): Promise<ShiftTemplate[]> {
    try {
      return await opsListShifts(hospitalId);
    } catch {
      return [];
    }
  },

  saveShift: (
    input: {
      id?: string;
      hospitalId: string;
      name: string;
      startTime: string;
      endTime: string;
      departmentId?: string | null;
      breakMinutes?: number;
    }
  ): Promise<ShiftTemplate> => opsSaveShift(input),

  setShiftStatus: (id: string, status: "active" | "inactive"): Promise<void> =>
    opsSetShiftStatus(id, status),

  doctorAvailability: (
    doctorId: string,
    hospitalId: string,
    fromDate: string,
    days?: number
  ): Promise<DayAvailability[]> =>
    opsDoctorAvailability(doctorId, hospitalId, fromDate, days).catch(() => []),

  /* ── OPD sessions (WS5) ── */

  listSessions: (hospitalId: string, date?: string) =>
    opsListSessions(hospitalId, date).catch(() => [] as Array<Record<string, unknown>>),

  getSession: (sessionId: string) => opsGetSession(sessionId),

  listSessionQueue: (sessionId: string) =>
    opsListSessionQueue(sessionId).catch(() => [] as unknown[]),

  openSession: (sessionId: string) => opsOpenSession(sessionId),
  activateSession: (sessionId: string) => opsActivateSession(sessionId),
  pauseSession: (sessionId: string, reason: string, etaMinutes?: number) =>
    opsPauseSession(sessionId, reason, etaMinutes),
  resumeSession: (sessionId: string) => opsResumeSession(sessionId),
  completeSession: (sessionId: string) => opsCompleteSession(sessionId),
  cancelSession: (sessionId: string, reason: string) => opsCancelSession(sessionId, reason),

  /* ── Closures & config history (WS6) ── */

  createClosure: (
    input: {
      hospitalId: string;
      scope: "hospital" | "department";
      departmentId?: string | null;
      type: "holiday" | "maintenance" | "emergency";
      fromDate: string;
      toDate: string;
      reason: string;
    }
  ) => opsCreateClosure(input),

  listClosures: (hospitalId: string) =>
    opsListClosures(hospitalId).catch(() => [] as Array<Record<string, unknown>>),

  rescheduleAffected: (closureId: string) => opsRescheduleAffected(closureId),

  cancelAffected: (closureId: string) => opsCancelAffected(closureId),

  listConfigVersions: (hospitalId: string, entity: ConfigVersion["entity"], entityId?: string) =>
    opsListConfigVersions(hospitalId, entity, entityId).catch(() => [] as ConfigVersion[]),

  /* ── Live ops dashboard (WS7) ── */

  todayOverview: (hospitalId: string): Promise<HospitalDashboard> =>
    opsHospitalDashboard(hospitalId).catch(() => ({
      opdPatients: 0,
      appointments: 0,
      walkIns: 0,
      waiting: 0,
      inConsultation: 0,
      completed: 0,
      avgWaitMinutes: 0,
      doctorsActive: 0,
      departmentsActive: 0,
    })),

  alerts: (hospitalId: string) => opsOperationalAlerts(hospitalId).catch(() => [] as OperationalAlert[]),
};

export type { OpsDepartmentConfig, OpsDepartmentConfigInput };

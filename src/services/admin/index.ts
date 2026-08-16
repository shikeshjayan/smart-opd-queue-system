import type {
  AdminNotification,
  AdminProfile,
  AdminSettings,
  Department,
  DoctorRecord,
  OPD,
  OPDStatus,
  PatientSummary,
  QueueHealth,
  StaffMember,
} from "@/types";
import {
  HOSPITAL_ADMIN,
  addDepartment,
  addDoctor,
  addOpd,
  countCompletedTokensByHospital,
  countDoctorsByHospital,
  countPatientsByHospital,
  countStaffByHospital,
  countTokensByHospital,
  countWaitingByHospital,
  countWaitingByOpd,
  getDepartment,
  getHospital,
  getOpd,
  getPatient,
  listAllEncounters,
  listDepartments,
  listDoctorsByHospital,
  listEncounters,
  listOpds,
  listOpdsByHospital,
  listPatientsByHospital,
  listQueue,
  listStaffByHospital,
  markNotificationRead,
  mockAdminSettings,
  mockDepartments,
  mockHospitals,
  mockNotifications,
  mockOpds,
  saveSettings,
  setDepartmentStatus,
  setDoctorStatus,
  setOpdStatus,
} from "../data";
import type {
  AdminDashboardData,
  AdminDepartmentDetail,
  AdminDoctorDetail,
  AdminOpdDetail,
  AdminPatientDetail,
  AdminReport,
  AdminSettingsInput,
  HospitalStats,
  QueueOverviewItem,
} from "./types";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

const DEFAULT_SETTINGS: Pick<
  AdminSettings,
  "queueHealthThresholds" | "opdOpenTime" | "opdCloseTime" | "tokenWindowMinutes"
> = {
  queueHealthThresholds: { warning: 10, critical: 20 },
  opdOpenTime: "09:00",
  opdCloseTime: "17:00",
  tokenWindowMinutes: 30,
};

function getSettingsFor(hospitalId: string): AdminSettings {
  return (
    mockAdminSettings.find((s) => s.hospitalId === hospitalId) ?? {
      hospitalId,
      ...DEFAULT_SETTINGS,
      updatedAt: new Date().toISOString(),
      updatedBy: HOSPITAL_ADMIN.name,
    }
  );
}

export function queueHealthFor(waiting: number, settings: AdminSettings): QueueHealth {
  if (waiting >= settings.queueHealthThresholds.critical) return "critical";
  if (waiting >= settings.queueHealthThresholds.warning) return "warning";
  return "healthy";
}

function buildQueueOverview(hospitalId: string): QueueOverviewItem[] {
  const settings = getSettingsFor(hospitalId);
  return listOpdsByHospital(hospitalId).map((opd) => {
    const department = getDepartment(opd.departmentId);
    const waiting = countWaitingByOpd(opd.id);
    const queue = listQueue(opd.id);
    return {
      opdId: opd.id,
      opdName: opd.name,
      departmentId: opd.departmentId,
      departmentName: department?.name ?? "",
      startTime: opd.startTime,
      endTime: opd.endTime,
      status: opd.status,
      nowServing: opd.currentlyServing,
      waiting,
      total: queue.length,
      completed: queue.filter((q) => q.status === "completed").length,
      health: queueHealthFor(waiting, settings),
    };
  });
}

export const adminService = {
  async getProfile(): Promise<AdminProfile> {
    await delay();
    return HOSPITAL_ADMIN;
  },

  async listHospitals() {
    await delay();
    return mockHospitals;
  },

  async getDashboard(hospitalId: string): Promise<AdminDashboardData> {
    await delay();
    const hospital = getHospital(hospitalId);
    if (!hospital) throw new Error("Hospital not found");

    const opds = listOpdsByHospital(hospitalId);
    const departments = listDepartments(hospitalId);

    const stats: HospitalStats = {
      departments: departments.length,
      opds: opds.length,
      opdsOpen: opds.filter((o) => o.status === "open" || o.status === "full").length,
      doctors: countDoctorsByHospital(hospitalId),
      doctorsActive: listDoctorsByHospital(hospitalId).filter((d) => d.status === "active").length,
      staff: countStaffByHospital(hospitalId),
      patients: countPatientsByHospital(hospitalId),
      tokensToday: countTokensByHospital(hospitalId),
      waiting: countWaitingByHospital(hospitalId),
      completed: countCompletedTokensByHospital(hospitalId),
    };

    const alerts = mockNotifications.filter(
      (n) => n.hospitalId === hospitalId && !n.read
    );

    return { hospital, stats, queueOverview: buildQueueOverview(hospitalId), alerts };
  },

  async getQueueOverview(hospitalId: string): Promise<QueueOverviewItem[]> {
    await delay();
    return buildQueueOverview(hospitalId);
  },

  async listDepartments(hospitalId: string): Promise<Department[]> {
    await delay();
    return listDepartments(hospitalId);
  },

  async addDepartment(hospitalId: string, name: string): Promise<Department> {
    await delay();
    return addDepartment(hospitalId, name);
  },

  async setDepartmentStatus(id: string, status: Department["status"]): Promise<void> {
    await delay();
    setDepartmentStatus(id, status);
  },

  async getDepartmentDetail(
    hospitalId: string,
    departmentId: string
  ): Promise<AdminDepartmentDetail | null> {
    await delay();
    const department = getDepartment(departmentId);
    if (!department || department.hospitalId !== hospitalId) return null;
    const opds = listOpds(departmentId);
    const doctors = listDoctorsByHospital(hospitalId).filter(
      (d) => d.departmentId === departmentId
    );
    const waiting = opds.reduce((sum, opd) => sum + countWaitingByOpd(opd.id), 0);
    return { department, opds, doctors, waiting };
  },

  async listOpds(hospitalId: string): Promise<OPD[]> {
    await delay();
    return listOpdsByHospital(hospitalId);
  },

  async addOpd(input: {
    departmentId: string;
    name: string;
    startTime: string;
    endTime: string;
  }): Promise<OPD> {
    await delay();
    return addOpd(input);
  },

  async setOpdStatus(id: string, status: OPDStatus): Promise<void> {
    await delay();
    setOpdStatus(id, status);
  },

  async getOpdDetail(hospitalId: string, opdId: string): Promise<AdminOpdDetail | null> {
    await delay();
    const opd = getOpd(opdId);
    if (!opd) return null;
    const department = getDepartment(opd.departmentId);
    if (!department || department.hospitalId !== hospitalId) return null;

    const doctor = listDoctorsByHospital(hospitalId).find((d) =>
      d.opdIds.includes(opdId)
    );

    const queue = listQueue(opdId);
    const counts = {
      total: queue.length,
      completed: queue.filter((q) => q.status === "completed").length,
      waiting: queue.filter((q) => q.status === "waiting").length,
      skipped: queue.filter((q) => q.status === "skipped").length,
      inConsultation: queue.filter((q) => q.status === "in_consultation").length,
      cancelled: queue.filter((q) => q.status === "cancelled").length,
    };

    return {
      opd,
      department,
      doctor: doctor ?? undefined,
      counts,
      health: queueHealthFor(counts.waiting, getSettingsFor(hospitalId)),
    };
  },

  async listDoctors(hospitalId: string): Promise<DoctorRecord[]> {
    await delay();
    return listDoctorsByHospital(hospitalId);
  },

  async addDoctor(input: {
    hospitalId: string;
    departmentId: string;
    name: string;
    speciality: string;
    phone: string;
    email: string;
  }): Promise<DoctorRecord> {
    await delay();
    return addDoctor(input);
  },

  async setDoctorStatus(id: string, status: DoctorRecord["status"]): Promise<void> {
    await delay();
    setDoctorStatus(id, status);
  },

  async getDoctorDetail(hospitalId: string, doctorId: string): Promise<AdminDoctorDetail | null> {
    await delay();
    const doctor = listDoctorsByHospital(hospitalId).find((d) => d.id === doctorId);
    if (!doctor) return null;
    const department = getDepartment(doctor.departmentId);
    const opds = doctor.opdIds
      .map((id) => getOpd(id))
      .filter((opd): opd is OPD => Boolean(opd));
    return {
      doctor,
      departmentName: department?.name ?? "",
      opds,
    };
  },

  async listStaff(hospitalId: string): Promise<StaffMember[]> {
    await delay();
    return listStaffByHospital(hospitalId);
  },

  async listPatients(hospitalId: string): Promise<PatientSummary[]> {
    await delay();
    return listPatientsByHospital(hospitalId).sort((a, b) => a.name.localeCompare(b.name));
  },

  async getPatientDetail(
    hospitalId: string,
    patientId: string
  ): Promise<AdminPatientDetail | null> {
    await delay();
    const patient = getPatient(patientId);
    if (!patient || patient.registeredHospitalId !== hospitalId) return null;
    return { patient, encounters: listEncounters(patientId) };
  },

  async getReports(hospitalId: string): Promise<AdminReport> {
    await delay();
    const hospital = getHospital(hospitalId);
    if (!hospital) throw new Error("Hospital not found");

    const opds = listOpdsByHospital(hospitalId);
    const byDepartment = listDepartments(hospitalId).map((department) => {
      const departmentOpds = opds.filter((o) => o.departmentId === department.id);
      const tokens = departmentOpds.reduce((sum, opd) => sum + listQueue(opd.id).length, 0);
      const waiting = departmentOpds.reduce((sum, opd) => sum + countWaitingByOpd(opd.id), 0);
      const completed = departmentOpds.reduce(
        (sum, opd) => sum + listQueue(opd.id).filter((q) => q.status === "completed").length,
        0
      );
      return {
        departmentId: department.id,
        departmentName: department.name,
        tokens,
        waiting,
        completed,
      };
    });

    const totalTokens = byDepartment.reduce((sum, d) => sum + d.tokens, 0);
    const totalCompleted = byDepartment.reduce((sum, d) => sum + d.completed, 0);

    const recentEncounters = listAllEncounters().filter((e) => {
      const opd = mockOpds.find((o) => o.id === e.opdId);
      const department = opd ? mockDepartments.find((d) => d.id === opd.departmentId) : undefined;
      return department?.hospitalId === hospitalId;
    });

    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return {
      hospital,
      period: `Today · ${today}`,
      totals: {
        tokens: totalTokens,
        completed: totalCompleted,
        consultations: recentEncounters.length,
        missed: totalTokens - totalCompleted,
      },
      byDepartment,
      recentEncounters: recentEncounters.slice(0, 10),
    };
  },

  async getSettings(hospitalId: string): Promise<AdminSettings> {
    await delay();
    return getSettingsFor(hospitalId);
  },

  async saveSettings(hospitalId: string, input: AdminSettingsInput): Promise<AdminSettings> {
    await delay();
    return saveSettings(hospitalId, input, HOSPITAL_ADMIN.name);
  },

  async listNotifications(hospitalId: string): Promise<AdminNotification[]> {
    await delay();
    return mockNotifications
      .filter((n) => n.hospitalId === hospitalId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async markNotificationRead(id: string): Promise<void> {
    await delay();
    markNotificationRead(id);
  },

  async markAllNotificationsRead(hospitalId: string): Promise<void> {
    await delay();
    mockNotifications
      .filter((n) => n.hospitalId === hospitalId)
      .forEach((n) => {
        n.read = true;
      });
  },
};

import type {
  DistrictAdminProfile,
  DistrictPerformance,
  GovernmentAlert,
  GovernmentAlertSeverity,
  GovernmentAlertStatus,
  Hospital,
  QueueHealth,
  StateAdminProfile,
} from "@/types";
import type { DistrictId } from "@/config/districts";
import { getDistrictName } from "@/config/districts";
import {
  DISTRICT_ADMIN,
  STATE_ADMIN,
  countCompletedTokensByHospital,
  countDepartmentsByHospital,
  countDoctorsByHospital,
  countTokensByHospital,
  countWaitingByHospital,
  countWaitingByOpd,
  getDepartment,
  getHospital,
  getOpd,
  listAllAlerts,
  listAllEncounters,
  listDepartments,
  listDoctorsByHospital,
  listHospitalsByDistrict,
  listOpdsByHospital,
  listQueue,
  mockDistrictPerformance,
  mockHospitals,
} from "../data";
import type {
  DistrictDashboardData,
  GovernmentHospitalDetail,
  GovernmentHospitalRow,
  GovernmentQueueItem,
  GovernmentReport,
  GovernmentReportFilters,
  QueueMonitorFilters,
  StateDashboardData,
} from "./types";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

const GOVERNMENT_QUEUE_THRESHOLDS = { warning: 20, critical: 40 };

function healthFor(waiting: number): QueueHealth {
  if (waiting >= GOVERNMENT_QUEUE_THRESHOLDS.critical) return "critical";
  if (waiting >= GOVERNMENT_QUEUE_THRESHOLDS.warning) return "warning";
  return "healthy";
}

function districtPerformanceFor(districtId: DistrictId): DistrictPerformance {
  const found = mockDistrictPerformance.find((d) => d.districtId === districtId);
  if (!found) {
    throw new Error(`District not found: ${districtId}`);
  }
  return found;
}

function buildQueueRows(hospitals: Hospital[]): GovernmentQueueItem[] {
  const rows: GovernmentQueueItem[] = [];
  for (const hospital of hospitals) {
    for (const opd of listOpdsByHospital(hospital.id)) {
      const department = getDepartment(opd.departmentId);
      const queue = listQueue(opd.id);
      const waiting = countWaitingByOpd(opd.id);
      rows.push({
        opdId: opd.id,
        opdName: opd.name,
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        districtId: hospital.district,
        departmentId: opd.departmentId,
        departmentName: department?.name ?? "",
        status: opd.status,
        nowServing: opd.currentlyServing,
        waiting,
        total: queue.length,
        completed: queue.filter((q) => q.status === "completed").length,
        health: healthFor(waiting),
      });
    }
  }
  return rows.sort((a, b) => b.waiting - a.waiting);
}

function buildHospitalRows(districtId: DistrictId): GovernmentHospitalRow[] {
  return listHospitalsByDistrict(districtId).map((hospital) => {
    const waiting = countWaitingByHospital(hospital.id);
    return {
      hospital,
      districtId,
      patientsToday: countTokensByHospital(hospital.id),
      waiting,
      completed: countCompletedTokensByHospital(hospital.id),
      activeOpds: listOpdsByHospital(hospital.id).filter(
        (o) => o.status === "open" || o.status === "full"
      ).length,
      departments: listDepartments(hospital.id).length,
      doctors: countDoctorsByHospital(hospital.id),
      health: healthFor(waiting),
    };
  });
}

function encountersForHospitalIds(hospitalIds: string[]) {
  const ids = new Set(hospitalIds);
  return listAllEncounters().filter((e) => {
    const opd = getOpd(e.opdId);
    const department = opd ? getDepartment(opd.departmentId) : undefined;
    return Boolean(department && ids.has(department.hospitalId));
  });
}

export const governmentService = {
  async getDistrictProfile(): Promise<DistrictAdminProfile> {
    await delay();
    return DISTRICT_ADMIN;
  },

  async getStateProfile(): Promise<StateAdminProfile> {
    await delay();
    return STATE_ADMIN;
  },

  async listDistricts(): Promise<DistrictPerformance[]> {
    await delay();
    return [...mockDistrictPerformance];
  },

  async getDistrictPerformance(districtId: DistrictId): Promise<DistrictPerformance> {
    await delay();
    return districtPerformanceFor(districtId);
  },

  async getStateDashboard(): Promise<StateDashboardData> {
    await delay();
    const districts = [...mockDistrictPerformance];
    const patientsToday = districts.reduce((sum, d) => sum + d.patientsToday, 0);
    const waiting = districts.reduce((sum, d) => sum + d.waiting, 0);
    const completed = districts.reduce((sum, d) => sum + d.completed, 0);
    const avgWaitMinutes = Math.round(
      districts.reduce((sum, d) => sum + d.avgWaitMinutes, 0) / districts.length
    );
    const hospitals = districts.reduce((sum, d) => sum + d.hospitals, 0);

    const allRows = buildQueueRows(mockHospitals);
    const criticalAlerts = listAllAlerts().filter(
      (a) => a.severity === "critical" && a.status === "active"
    );
    const bottlenecks = [...allRows]
      .sort((a, b) => b.waiting - a.waiting)
      .slice(0, 5)
      .map((row) => ({
        hospitalId: row.hospitalId,
        hospitalName: row.hospitalName,
        districtId: row.districtId,
        departmentName: row.departmentName,
        waiting: row.waiting,
      }));

    return {
      state: {
        name: "Kerala",
        districts: districts.length,
        hospitals,
      },
      totals: {
        patientsToday,
        waiting,
        completed,
        activeOpds: 3921,
        avgWaitMinutes,
      },
      districts,
      criticalAlerts,
      bottlenecks,
    };
  },

  async getDistrictDashboard(districtId: DistrictId): Promise<DistrictDashboardData> {
    await delay();
    const performance = districtPerformanceFor(districtId);
    const hospitals = buildHospitalRows(districtId);
    const queueRows = buildQueueRows(hospitals.map((h) => h.hospital));
    const alerts = listAllAlerts().filter(
      (a) => a.districtId === districtId && a.status === "active"
    );
    const worst = queueRows[0];
    const longestQueue = worst
      ? {
          hospitalName: worst.hospitalName,
          departmentName: worst.departmentName,
          waiting: worst.waiting,
        }
      : null;

    return {
      district: { id: districtId, name: performance.districtName },
      performance,
      hospitals,
      queueOverview: queueRows,
      alerts,
      longestQueue,
    };
  },

  async listHospitalsByDistrict(districtId: DistrictId): Promise<GovernmentHospitalRow[]> {
    await delay();
    return buildHospitalRows(districtId);
  },

  async listHospitals(): Promise<Hospital[]> {
    await delay();
    return [...mockHospitals];
  },

  async listHospitalRows(): Promise<GovernmentHospitalRow[]> {
    await delay();
    return mockHospitals.map((hospital) => {
      const waiting = countWaitingByHospital(hospital.id);
      return {
        hospital,
        districtId: hospital.district,
        patientsToday: countTokensByHospital(hospital.id),
        waiting,
        completed: countCompletedTokensByHospital(hospital.id),
        activeOpds: listOpdsByHospital(hospital.id).filter(
          (o) => o.status === "open" || o.status === "full"
        ).length,
        departments: countDepartmentsByHospital(hospital.id),
        doctors: countDoctorsByHospital(hospital.id),
        health: healthFor(waiting),
      };
    });
  },

  async getHospitalDetail(hospitalId: string): Promise<GovernmentHospitalDetail | null> {
    await delay();
    const hospital = getHospital(hospitalId);
    if (!hospital) return null;

    const departments = listDepartments(hospitalId);
    const opds = listOpdsByHospital(hospitalId);
    const doctors = listDoctorsByHospital(hospitalId);

    return {
      hospital,
      districtName: getDistrictName(hospital.district),
      stats: {
        departments: departments.length,
        opds: opds.length,
        opdsOpen: opds.filter((o) => o.status === "open" || o.status === "full").length,
        doctors: doctors.length,
        waiting: countWaitingByHospital(hospitalId),
        completed: countCompletedTokensByHospital(hospitalId),
      },
      departments: departments.map((department) => ({
        department,
        waiting: listOpdsByHospital(hospitalId)
          .filter((o) => o.departmentId === department.id)
          .reduce((sum, o) => sum + countWaitingByOpd(o.id), 0),
      })),
      opds,
      doctors,
      queues: buildQueueRows([hospital]),
    };
  },

  async listQueueMonitor(
    districtIds: DistrictId[],
    filters: QueueMonitorFilters = {}
  ): Promise<GovernmentQueueItem[]> {
    await delay();
    const hospitals = mockHospitals.filter((h) => districtIds.includes(h.district));
    let rows = buildQueueRows(hospitals);
    if (filters.hospitalId) rows = rows.filter((r) => r.hospitalId === filters.hospitalId);
    if (filters.departmentId) rows = rows.filter((r) => r.departmentId === filters.departmentId);
    if (filters.status) rows = rows.filter((r) => r.status === filters.status);
    if (filters.minWaiting !== undefined && filters.minWaiting > 0) {
      rows = rows.filter((r) => r.waiting >= (filters.minWaiting as number));
    }
    return rows;
  },

  async listAlerts(
    districtIds: DistrictId[] | null,
    filters: {
      hospitalId?: string;
      severity?: GovernmentAlertSeverity | "";
      status?: GovernmentAlertStatus | "";
    } = {}
  ): Promise<GovernmentAlert[]> {
    await delay();
    let alerts = listAllAlerts();
    if (districtIds) alerts = alerts.filter((a) => districtIds.includes(a.districtId));
    if (filters.hospitalId) alerts = alerts.filter((a) => a.hospitalId === filters.hospitalId);
    if (filters.severity) alerts = alerts.filter((a) => a.severity === filters.severity);
    if (filters.status) alerts = alerts.filter((a) => a.status === filters.status);
    return alerts;
  },

  async getReport(
    scope: "state" | "district",
    districtId: DistrictId | null,
    filters: GovernmentReportFilters = {}
  ): Promise<GovernmentReport> {
    await delay();
    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let scopeName: string;
    let rows: Array<{ id: string; label: string; tokens: number; completed: number; waiting: number }>;
    let hospitalIds: string[];

    if (scope === "state") {
      scopeName = "Kerala";
      rows = mockDistrictPerformance.map((d) => ({
        id: d.districtId,
        label: d.districtName,
        tokens: d.patientsToday,
        completed: d.completed,
        waiting: d.waiting,
      }));
      hospitalIds = mockHospitals.map((h) => h.id);
    } else {
      const district = districtId ?? "ernakulam";
      scopeName = getDistrictName(district);
      rows = buildHospitalRows(district).map((row) => ({
        id: row.hospital.id,
        label: row.hospital.name,
        tokens: row.patientsToday,
        completed: row.completed,
        waiting: row.waiting,
      }));
      hospitalIds = buildHospitalRows(district).map((row) => row.hospital.id);
    }

    if (filters.departmentId) {
      rows = rows.filter((r) => r.id === filters.departmentId || r.id === filters.hospitalId);
    }
    if (filters.hospitalId) {
      rows = rows.filter((r) => r.id === filters.hospitalId);
    }

    const totalTokens = rows.reduce((sum, r) => sum + r.tokens, 0);
    const totalCompleted = rows.reduce((sum, r) => sum + r.completed, 0);

    const recentEncounters = encountersForHospitalIds(hospitalIds)
      .slice(0, 10)
      .map((e) => {
        const opd = getOpd(e.opdId);
        const department = opd ? getDepartment(opd.departmentId) : undefined;
        const hospital = department
          ? getHospital(department.hospitalId)
          : undefined;
        return {
          id: e.id,
          patientName: e.patientId,
          hospitalName: hospital?.name ?? e.hospitalName,
          departmentName: department?.name ?? e.departmentName,
          date: e.date,
        };
      });

    return {
      scope,
      scopeName,
      period: `Today · ${today}`,
      totals: {
        tokens: totalTokens,
        completed: totalCompleted,
        consultations: recentEncounters.length,
        missed: totalTokens - totalCompleted,
      },
      rows,
      recentEncounters,
    };
  },
};

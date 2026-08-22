import type {
  Announcement,
  AnnouncementAudience,
  CapacityRow,
  CapacityStatus,
  ComparisonRow,
  DepartmentPerformanceRow,
  DistrictAuditAction,
  DistrictAuditEvent,
  DistrictDateRange,
  DistrictFilters,
  DistrictHospitalRow,
  DistrictQueueItem,
  DistrictReportType,
  DistrictSettings,
  DistrictStats,
  DoctorAvailabilityRow,
  HospitalLoadStatus,
  MapPoint,
  OpdAnalyticsData,
  OpdAnalyticsPeriod,
  ReferralFlow,
  ResourceSummaryRow,
  ServiceAvailabilityRow,
} from "./types";
import { DEFAULT_DISTRICT_FILTERS } from "./types";
import type { QueueHealth, GovernmentAlert } from "@/types";
import type { DistrictId } from "@/config/districts";
import { getDistrictName } from "@/config/districts";
import {
  countCompletedTokensByHospital,
  countTokensByHospital,
  countWaitingByHospital,
  countWaitingByOpd,
  getDepartment,
  getHospital,
  listAllAlerts,
  listDepartments,
  listDoctorsByHospital,
  listHospitalsByDistrict,
  listOpdsByHospital,
  listQueue,
  listStaffByHospital,
} from "@/services/data";
import { appointmentService } from "@/services/appointments";
import type { Appointment } from "@/services/appointments/types";
import { AVG_CONSULTATION_MINUTES, hospitalOpsService } from "@/services/hospital-ops";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));
const STORE_KEY = "smart-health.district.v1";

const LOAD_THRESHOLDS = { highLoad: 20, alert: 40 };
const DEFAULT_EXPECTED_CAPACITY = 100;

export const DISTRICT_MAP_POINTS: MapPoint[] = [
  { hospitalId: "hos_001", x: 58, y: 56 },
  { hospitalId: "hos_005", x: 46, y: 36 },
  { hospitalId: "hos_006", x: 64, y: 27 },
  { hospitalId: "hos_007", x: 80, y: 24 },
];

function mapPointFor(hospitalId: string, index: number): MapPoint {
  const known = DISTRICT_MAP_POINTS.find((p) => p.hospitalId === hospitalId);
  if (known) return known;
  return {
    hospitalId,
    x: 30 + ((index * 17) % 45),
    y: 25 + ((index * 23) % 40),
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function rangeStartISO(range: DistrictDateRange): string {
  const now = new Date();
  if (range === "today") return now.toISOString().slice(0, 10);
  const days = range === "7d" ? 7 : 30;
  const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return start.toISOString().slice(0, 10);
}

function periodLabelFor(range: DistrictDateRange): string {
  if (range === "today") return "Today";
  if (range === "7d") return "Last 7 days";
  return "Last 30 days";
}

type DistrictStore = {
  announcements: Announcement[];
  referrals: ReferralFlow[];
  audit: DistrictAuditEvent[];
  settings: DistrictSettings;
};

function seedStore(today: string): DistrictStore {
  return {
    announcements: [
      {
        id: "ann_seed_1",
        title: "Reduced OPD capacity at GH Perumbavoor",
        message:
          "OPD services at GH Perumbavoor will operate with reduced capacity tomorrow due to planned maintenance. General Medicine afternoon session is cancelled.",
        audience: "hospitals",
        targetIds: ["hos_006"],
        publishedAt: `${today}T08:30:00`,
        publishedBy: "K. P. Vishwanath",
        status: "published",
      },
      {
        id: "ann_seed_2",
        title: "Dengue fever protocol briefing",
        message:
          "All General Medicine and Pediatrics departments must follow the updated dengue triage protocol this week. Briefing material was circulated by email.",
        audience: "staff",
        targetIds: [],
        publishedAt: `${today}T07:15:00`,
        publishedBy: "K. P. Vishwanath",
        status: "published",
      },
    ],
    referrals: [
      { id: "ref_001", fromHospitalId: "hos_006", fromHospitalName: "GH Perumbavoor", toHospitalId: "hos_001", toHospitalName: "GH Ernakulam", count: 34, periodLabel: "This month" },
      { id: "ref_002", fromHospitalId: "hos_007", fromHospitalName: "GH Muvattupuzha", toHospitalId: "hos_005", toHospitalName: "GH Aluva", count: 21, periodLabel: "This month" },
      { id: "ref_003", fromHospitalId: "hos_005", fromHospitalName: "GH Aluva", toHospitalId: "hos_002", toHospitalName: "Medical College Kottayam", count: 18, periodLabel: "This month" },
      { id: "ref_004", fromHospitalId: "hos_007", fromHospitalName: "GH Muvattupuzha", toHospitalId: "hos_001", toHospitalName: "GH Ernakulam", count: 12, periodLabel: "This month" },
      { id: "ref_005", fromHospitalId: "hos_006", fromHospitalIdPlaceholder: undefined, fromHospitalName: "GH Perumbavoor", toHospitalId: "hos_007", toHospitalName: "GH Muvattupuzha", count: 7, periodLabel: "This month" } as ReferralFlow,
    ],
    audit: [
      { id: "daud_seed_1", at: `${today}T09:20:00`, actorId: "dadm_001", actorName: "K. P. Vishwanath", actorRole: "District Admin", action: "announcement_published", targetType: "announcement", targetId: "ann_seed_1", summary: "District announcement published: Reduced OPD capacity at GH Perumbavoor" },
      { id: "daud_seed_2", at: `${today}T08:05:00`, actorId: "dadm_001", actorName: "K. P. Vishwanath", actorRole: "District Admin", action: "hospital_status_changed", targetType: "hospital", targetId: "hos_006", summary: "GH Perumbavoor flagged High Load in monitoring view" },
      { id: "daud_seed_3", at: `${today}T07:40:00`, actorId: "dadm_001", actorName: "K. P. Vishwanath", actorRole: "District Admin", action: "district_config_updated", targetType: "settings", targetId: "reporting", summary: "District reporting set to aggregated-only mode" },
    ],
    settings: {
      reporting: {
        aggregateOnly: true,
        includeWalkInsInReports: true,
        weeklyReportDay: "monday",
      },
      serviceCatalogueVisible: true,
      hospitalActivationOverrides: {},
    },
  };
}

let cachedStore: DistrictStore | null = null;

function ensureLoaded(): DistrictStore {
  if (cachedStore) return cachedStore;
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      try {
        cachedStore = JSON.parse(raw) as DistrictStore;
        return cachedStore;
      } catch {
        localStorage.removeItem(STORE_KEY);
      }
    }
  }
  cachedStore = seedStore(todayISO());
  persistStore();
  return cachedStore;
}

function persistStore(): void {
  if (!cachedStore || typeof window === "undefined") return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(cachedStore));
  } catch {
    // storage unavailable (private mode); keep in-memory only
  }
}

function pushAudit(
  action: DistrictAuditAction,
  targetType: string,
  targetId: string,
  summary: string,
  actor?: { id: string; name: string; role: string }
): void {
  const store = ensureLoaded();
  store.audit.unshift({
    id: `daud_${Date.now()}_${store.audit.length}`,
    at: new Date().toISOString(),
    actorId: actor?.id ?? "system",
    actorName: actor?.name ?? "System",
    actorRole: actor?.role ?? "System",
    action,
    targetType,
    targetId,
    summary,
  });
  persistStore();
}

function loadStatusFor(waiting: number): HospitalLoadStatus {
  if (waiting >= LOAD_THRESHOLDS.alert) return "alert";
  if (waiting >= LOAD_THRESHOLDS.highLoad) return "high_load";
  return "normal";
}

function healthFor(waiting: number): QueueHealth {
  if (waiting >= LOAD_THRESHOLDS.alert) return "critical";
  if (waiting >= LOAD_THRESHOLDS.highLoad) return "warning";
  return "healthy";
}

async function appointmentsAsync(): Promise<Appointment[]> {
  return appointmentService.listAll();
}

function appointmentsInRange(all: Appointment[], range: DistrictDateRange): Appointment[] {
  const start = rangeStartISO(range);
  return all.filter((a) => a.scheduledDate >= start && a.scheduledDate <= todayISO());
}

function avgWaitForHospital(hospitalId: string): number {
  const waits = listOpdsByHospital(hospitalId)
    .map((o) => o.estimatedWaitMinutes)
    .filter((w): w is number => typeof w === "number");
  if (waits.length === 0) return 0;
  return Math.round(waits.reduce((sum, w) => sum + w, 0) / waits.length);
}

export const districtAdminService = {
  async getMapPoints(districtId: DistrictId): Promise<MapPoint[]> {
    await delay();
    return listHospitalsByDistrict(districtId).map((h, i) => mapPointFor(h.id, i));
  },

  async getHospitalRows(districtId: DistrictId, filters: DistrictFilters = DEFAULT_DISTRICT_FILTERS): Promise<DistrictHospitalRow[]> {
    await delay();
    let hospitals = listHospitalsByDistrict(districtId);
    if (filters.hospitalId) hospitals = hospitals.filter((h) => h.id === filters.hospitalId);
    const store = ensureLoaded();
    const rows: DistrictHospitalRow[] = hospitals.map((hospital) => {
      const departments = listDepartments(hospital.id).filter((d) => d.status === "active");
      const filteredDepts = filters.departmentId
        ? departments.filter((d) => d.id === filters.departmentId)
        : departments;
      let patients = 0;
      let waiting = 0;
      let completed = 0;
      for (const dept of filteredDepts) {
        for (const opd of listOpdsByHospital(dept.id)) {
          const queue = listQueue(opd.id);
          patients += queue.length;
          waiting += queue.filter((q) => q.status === "waiting" || q.status === "called").length;
          completed += queue.filter((q) => q.status === "completed").length;
        }
      }
      void countTokensByHospital;
      void countCompletedTokensByHospital;
      void countWaitingByHospital;
      const override = store.settings.hospitalActivationOverrides[hospital.id];
      const effectiveActive = override ? override === "active" : hospital.status === "active";
      return {
        hospitalId: hospital.id,
        name: hospital.name,
        address: hospital.address,
        phone: hospital.phone,
        patients,
        waiting,
        completed,
        avgWaitMinutes: avgWaitForHospital(hospital.id),
        activeOpds: listOpdsByHospital(hospital.id).filter((o) => o.status === "open" || o.status === "full").length,
        departments: effectiveActive ? filteredDepts.length : 0,
        doctors: listDoctorsByHospital(hospital.id).filter((d) => d.status === "active").length,
        status: loadStatusFor(waiting),
      };
    });
    return rows.sort((a, b) => b.waiting - a.waiting);
  },

  async getStats(districtId: DistrictId, filters: DistrictFilters = DEFAULT_DISTRICT_FILTERS): Promise<DistrictStats> {
    await delay();
    const rows = await this.getHospitalRows(districtId, filters);
    const allAppointments = await appointmentsAsync();
    const start = rangeStartISO(filters.dateRange);
    const scopedAppointments = allAppointments.filter(
      (a) =>
        a.scheduledDate >= start &&
        a.scheduledDate <= todayISO() &&
        rows.some((r) => r.hospitalId === a.hospitalId) &&
        (!filters.departmentId || a.departmentId === filters.departmentId)
    );
    return {
      districtId,
      districtName: getDistrictName(districtId),
      hospitals: rows.length,
      patientsToday: rows.reduce((sum, r) => sum + r.patients, 0),
      opdConsultations: rows.reduce((sum, r) => sum + r.completed, 0),
      appointments: scopedAppointments.length,
      waiting: rows.reduce((sum, r) => sum + r.waiting, 0),
      statuses: {
        normal: rows.filter((r) => r.status === "normal").length,
        highLoad: rows.filter((r) => r.status === "high_load").length,
        alert: rows.filter((r) => r.status === "alert").length,
      },
    };
  },

  async getComparison(districtId: DistrictId): Promise<ComparisonRow[]> {
    await delay();
    const rows = await this.getHospitalRows(districtId);
    return rows
      .slice()
      .sort((a, b) => b.patients - a.patients)
      .map((row, index) => ({
        rank: index + 1,
        hospitalId: row.hospitalId,
        name: row.name,
        patients: row.patients,
        waiting: row.waiting,
        avgWaitMinutes: row.avgWaitMinutes,
      }));
  },

  async getOpdAnalytics(
    districtId: DistrictId,
    period: OpdAnalyticsPeriod,
    filters: DistrictFilters = DEFAULT_DISTRICT_FILTERS
  ): Promise<OpdAnalyticsData> {
    await delay();
    const dateRange: DistrictDateRange =
      period === "today" ? "today" : period === "weekly" ? "7d" : "30d";
    const hospitals = listHospitalsByDistrict(districtId).filter(
      (h) => !filters.hospitalId || h.id === filters.hospitalId
    );
    const allAppointments = await appointmentsAsync();
    const scopedAppointments = appointmentsInRange(allAppointments, dateRange).filter(
      (a) => hospitals.some((h) => h.id === a.hospitalId)
    );

    let totalVisits = 0;
    let completed = 0;
    let noShows = 0;
    let waitSum = 0;
    let waitCount = 0;
    const volumeByName = new Map<string, number>();
    const bookedByName = new Map<string, number>();

    for (const hospital of hospitals) {
      for (const dept of listDepartments(hospital.id)) {
        if (filters.departmentId && dept.id !== filters.departmentId) continue;
        const deptName = dept.name;
        for (const opd of listOpdsByHospital(dept.id)) {
          const queue = listQueue(opd.id);
          totalVisits += queue.length;
          completed += queue.filter((q) => q.status === "completed").length;
          noShows += queue.filter((q) => q.status === "no_show").length;
          if (opd.estimatedWaitMinutes != null) {
            waitSum += opd.estimatedWaitMinutes;
            waitCount += 1;
          }
          volumeByName.set(deptName, (volumeByName.get(deptName) ?? 0) + queue.length);
          bookedByName.set(deptName, (bookedByName.get(deptName) ?? 0) + 1);
        }
      }
    }

    void bookedByName;

    const relevantAppointments = scopedAppointments.filter(
      (a) => !filters.departmentId || a.departmentId === filters.departmentId
    );
    const bookedCount = relevantAppointments.filter(
      (a) => a.status !== "cancelled"
    ).length;
    const appointmentNoShows = relevantAppointments.filter(
      (a) => a.status === "no_show"
    ).length;
    const walkIns = Math.max(0, totalVisits - bookedCount);

    return {
      period,
      periodLabel: periodLabelFor(dateRange),
      totalVisits,
      appointments: bookedCount,
      walkIns,
      completedConsultations: completed,
      noShows: Math.max(noShows, appointmentNoShows),
      avgWaitMinutes: waitCount > 0 ? Math.round(waitSum / waitCount) : 0,
      avgConsultationMinutes: AVG_CONSULTATION_MINUTES,
      departmentVolume: [...volumeByName.entries()]
        .map(([departmentName, visits]) => ({ departmentName, visits }))
        .sort((a, b) => b.visits - a.visits),
    };
  },

  async getDepartmentPerformance(districtId: DistrictId): Promise<DepartmentPerformanceRow[]> {
    await delay();
    const perf = new Map<string, DepartmentPerformanceRow & { waitSum: number; waitCount: number }>();
    for (const hospital of listHospitalsByDistrict(districtId)) {
      for (const dept of listDepartments(hospital.id)) {
        if (dept.status !== "active") continue;
        let entry = perf.get(dept.name);
        if (!entry) {
          entry = {
            departmentName: dept.name,
            hospitals: 0,
            patients: 0,
            completed: 0,
            waiting: 0,
            avgWaitMinutes: 0,
            waitSum: 0,
            waitCount: 0,
          };
          perf.set(dept.name, entry);
        }
        entry.hospitals += 1;
        for (const opd of listOpdsByHospital(dept.id)) {
          const queue = listQueue(opd.id);
          entry.patients += queue.length;
          entry.completed += queue.filter((q) => q.status === "completed").length;
          entry.waiting += queue.filter((q) => q.status === "waiting" || q.status === "called").length;
          if (opd.estimatedWaitMinutes != null) {
            entry.waitSum += opd.estimatedWaitMinutes;
            entry.waitCount += 1;
          }
        }
      }
    }
    return [...perf.values()]
      .map(({ waitSum, waitCount, ...row }) => ({
        ...row,
        avgWaitMinutes: waitCount > 0 ? Math.round(waitSum / waitCount) : 0,
      }))
      .sort((a, b) => b.patients - a.patients);
  },

  async getCapacity(districtId: DistrictId): Promise<CapacityRow[]> {
    await delay();
    const rows: CapacityRow[] = [];
    for (const hospital of listHospitalsByDistrict(districtId)) {
      const exceptions = await hospitalOpsService.listExceptions(hospital.id, false);
      for (const dept of listDepartments(hospital.id)) {
        if (dept.status !== "active") continue;
        let expected = 0;
        const schedule = await hospitalOpsService.getWeeklySchedule(dept.id);
        if (schedule) {
          expected = Object.values(schedule.days).reduce(
            (sum, day) => sum + (day ? schedule.maxAppointmentsPerDay : 0),
            0
          );
        }
        if (expected <= 0) expected = DEFAULT_EXPECTED_CAPACITY;

        let appointments = 0;
        let tokens = 0;
        for (const opd of listOpdsByHospital(dept.id)) {
          tokens += listQueue(opd.id).length;
        }
        const allAppointments = await appointmentsAsync();
        appointments = allAppointments.filter(
          (a) =>
            a.hospitalId === hospital.id &&
            a.departmentId === dept.id &&
            a.scheduledDate === todayISO() &&
            a.status !== "cancelled"
        ).length;
        const walkIns = Math.max(0, tokens - appointments);
        const total = tokens;
        const utilizationPercent = Math.round((total / expected) * 100);
        let status: CapacityStatus = "normal";
        if (total > expected) status = "exceeded";
        else if (utilizationPercent >= 85) status = "near_capacity";
        void exceptions;
        rows.push({
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          departmentId: dept.id,
          departmentName: dept.name,
          expectedCapacity: expected,
          appointments,
          walkIns,
          total,
          utilizationPercent,
          status,
        });
      }
    }
    return rows.sort((a, b) => b.utilizationPercent - a.utilizationPercent);
  },

  async getResourceSummary(districtId: DistrictId): Promise<ResourceSummaryRow[]> {
    await delay();
    const rows: ResourceSummaryRow[] = [];
    for (const hospital of listHospitalsByDistrict(districtId)) {
      const doctors = listDoctorsByHospital(hospital.id);
      const staff = listStaffByHospital(hospital.id);
      let servicesActive = 0;
      try {
        const services = await hospitalOpsService.listServices(hospital.id);
        servicesActive = services.filter((s) => s.status === "active").length;
      } catch {
        servicesActive = 0;
      }
      const byRole = (role: string) =>
        staff.filter((s) => s.role === role && s.status === "active").length;
      rows.push({
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        doctorsTotal: doctors.length,
        doctorsAvailable: doctors.filter((d) => d.status === "active").length,
        nurses: byRole("nurse"),
        labStaff: byRole("lab_technician"),
        pharmacyStaff: byRole("pharmacist"),
        otherStaff: staff.filter((s) => s.status === "active" && ["receptionist", "accountant", "administrator"].includes(s.role)).length,
        servicesActive,
      });
    }
    return rows;
  },

  async getDoctorAvailability(
    hospitalId: string,
    departmentId?: string
  ): Promise<DoctorAvailabilityRow[]> {
    await delay();
    const exceptions = await hospitalOpsService.listExceptions(hospitalId, false);
    const today = todayISO();
    const rows: DoctorAvailabilityRow[] = [];
    for (const dept of listDepartments(hospitalId)) {
      if (dept.status !== "active") continue;
      if (departmentId && dept.id !== departmentId) continue;
      const doctors = listDoctorsByHospital(hospitalId).filter((d) => d.departmentId === dept.id);
      const leaveToday = exceptions.filter(
        (e) =>
          e.type === "doctor_unavailable" &&
          e.date === today &&
          e.status === "active" &&
          (!e.departmentId || e.departmentId === dept.id)
      ).length;
      const active = doctors.filter((d) => d.status === "active");
      rows.push({
        departmentId: dept.id,
        departmentName: dept.name,
        available: Math.max(0, active.length - leaveToday),
        onLeave: Math.min(leaveToday, active.length),
        unavailable: doctors.filter((d) => d.status !== "active").length,
        doctorNames: doctors.map((d) => d.name),
      });
    }
    return rows;
  },

  async getServiceMatrix(districtId: DistrictId): Promise<{
    hospitals: Array<{ id: string; name: string }>;
    rows: ServiceAvailabilityRow[];
  }> {
    await delay();
    const hospitals = listHospitalsByDistrict(districtId);
    const matrix = new Map<string, ServiceAvailabilityRow>();
    for (const hospital of hospitals) {
      const services = await hospitalOpsService.listServices(hospital.id);
      for (const service of services) {
        if (service.status !== "active") continue;
        const key = service.code || service.name.toLowerCase();
        let row = matrix.get(key);
        if (!row) {
          row = { serviceName: service.name, code: key, providerHospitalIds: [] };
          matrix.set(key, row);
        }
        if (!row.providerHospitalIds.includes(hospital.id)) {
          row.providerHospitalIds.push(hospital.id);
        }
      }
    }
    return {
      hospitals: hospitals.map((h) => ({ id: h.id, name: h.name })),
      rows: [...matrix.values()].sort((a, b) => a.serviceName.localeCompare(b.serviceName)),
    };
  },

  async getReferrals(districtId: DistrictId): Promise<ReferralFlow[]> {
    await delay();
    void districtId;
    return ensureLoaded().referrals.slice();
  },

  async getAlerts(districtId: DistrictId): Promise<GovernmentAlert[]> {
    await delay();
    return listAllAlerts().filter((a) => a.districtId === districtId && a.status === "active");
  },

  async getQueueMonitor(districtId: DistrictId): Promise<DistrictQueueItem[]> {
    await delay();
    const rows: DistrictQueueItem[] = [];
    for (const hospital of listHospitalsByDistrict(districtId)) {
      for (const opd of listOpdsByHospital(hospital.id)) {
        const waiting = countWaitingByOpd(opd.id);
        const dept = getDepartment(opd.departmentId);
        rows.push({
          opdId: opd.id,
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          departmentName: dept?.name ?? "",
          status: opd.status,
          nowServing: opd.currentlyServing,
          waiting,
          health: healthFor(waiting),
        });
      }
    }
    return rows.sort((a, b) => b.waiting - a.waiting);
  },

  async listAnnouncements(districtId: DistrictId): Promise<Announcement[]> {
    await delay();
    void districtId;
    return ensureLoaded()
      .announcements.slice()
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  },

  async publishAnnouncement(
    input: { title: string; message: string; audience: AnnouncementAudience; targetIds: string[] },
    actor?: { id: string; name: string; role: string },
    permissionCheck?: (permission: string) => boolean
  ): Promise<Announcement | null> {
    await delay();
    if (permissionCheck && !permissionCheck("PUBLISH_ANNOUNCEMENTS")) {
      throw new Error("You don't have permission to publish district announcements.");
    }
    const store = ensureLoaded();
    const announcement: Announcement = {
      id: `ann_${Date.now()}`,
      title: input.title.trim(),
      message: input.message.trim(),
      audience: input.audience,
      targetIds: input.targetIds,
      publishedAt: new Date().toISOString(),
      publishedBy: actor?.name ?? "District Admin",
      status: "published",
    };
    store.announcements.unshift(announcement);
    persistStore();
    pushAudit(
      "announcement_published",
      "announcement",
      announcement.id,
      `District announcement published: ${announcement.title}`,
      actor
    );
    return announcement;
  },

  async getLatestAnnouncement(districtId: DistrictId): Promise<Announcement | null> {
    await delay();
    void districtId;
    const published = ensureLoaded()
      .announcements.filter((a) => a.status === "published")
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return published[0] ?? null;
  },

  async getSettings(districtId: DistrictId): Promise<DistrictSettings> {
    await delay();
    void districtId;
    return structuredClone(ensureLoaded().settings);
  },

  async saveSettings(
    settings: DistrictSettings,
    actor?: { id: string; name: string; role: string },
    permissionCheck?: (permission: string) => boolean
  ): Promise<DistrictSettings | null> {
    await delay();
    if (permissionCheck && !permissionCheck("MANAGE_DISTRICT_SETTINGS")) {
      throw new Error("You don't have permission to change district settings.");
    }
    const store = ensureLoaded();
    store.settings = structuredClone(settings);
    persistStore();
    pushAudit("district_config_updated", "settings", "district", "District configuration updated", actor);
    return structuredClone(store.settings);
  },

  async setHospitalActivation(
    hospitalId: string,
    status: "active" | "inactive",
    actor?: { id: string; name: string; role: string },
    permissionCheck?: (permission: string) => boolean
  ): Promise<DistrictSettings | null> {
    await delay();
    if (permissionCheck && !permissionCheck("MANAGE_DISTRICT_SETTINGS")) {
      throw new Error("You don't have permission to change hospital status.");
    }
    const hospital = getHospital(hospitalId);
    const store = ensureLoaded();
    store.settings.hospitalActivationOverrides[hospitalId] = status;
    persistStore();
    pushAudit(
      "hospital_status_changed",
      "hospital",
      hospitalId,
      `${hospital?.name ?? hospitalId} activation changed to ${status}`,
      actor
    );
    return structuredClone(store.settings);
  },

  async listAudit(
    districtId: DistrictId,
    filters: { action?: DistrictAuditAction | ""; query?: string } = {}
  ): Promise<DistrictAuditEvent[]> {
    await delay();
    void districtId;
    let events = ensureLoaded().audit.slice();
    if (filters.action) events = events.filter((e) => e.action === filters.action);
    if (filters.query) {
      const q = filters.query.toLowerCase();
      events = events.filter(
        (e) => e.summary.toLowerCase().includes(q) || e.actorName.toLowerCase().includes(q)
      );
    }
    return events;
  },

  async logReportExport(
    reportTitle: string,
    format: string,
    actor?: { id: string; name: string; role: string }
  ): Promise<void> {
    await delay();
    pushAudit("report_exported", "report", reportTitle, `${reportTitle} exported as ${format}`, actor);
  },

  async getReport(
    districtId: DistrictId,
    type: DistrictReportType,
    filters: DistrictFilters = DEFAULT_DISTRICT_FILTERS
  ): Promise<{
    type: DistrictReportType;
    title: string;
    period: string;
    summary: Array<{ label: string; value: string | number }>;
    table: { columns: string[]; rows: Array<Array<string | number>> };
  }> {
    await delay();
    const period = periodLabelFor(filters.dateRange);
    const districtName = getDistrictName(districtId);

    switch (type) {
      case "daily_district_opd": {
        const rows = await this.getHospitalRows(districtId, filters);
        const totals = rows.reduce(
          (acc, r) => ({
            patients: acc.patients + r.patients,
            completed: acc.completed + r.completed,
            waiting: acc.waiting + r.waiting,
          }),
          { patients: 0, completed: 0, waiting: 0 }
        );
        return {
          type,
          title: "Daily District OPD Report",
          period: `${districtName} · ${period}`,
          summary: [
            { label: "Patients", value: totals.patients },
            { label: "Completed", value: totals.completed },
            { label: "Waiting", value: totals.waiting },
          ],
          table: {
            columns: ["Hospital", "Patients", "Completed", "Waiting", "Avg Wait (min)"],
            rows: rows.map((r) => [r.name, r.patients, r.completed, r.waiting, r.avgWaitMinutes]),
          },
        };
      }
      case "hospital_performance": {
        const comparison = await this.getComparison(districtId);
        return {
          type,
          title: "Hospital Performance Report",
          period: `${districtName} · ${period}`,
          summary: [{ label: "Hospitals", value: comparison.length }],
          table: {
            columns: ["Rank", "Hospital", "Patients", "Waiting", "Avg Wait (min)"],
            rows: comparison.map((c) => [c.rank, c.name, c.patients, c.waiting, c.avgWaitMinutes]),
          },
        };
      }
      case "department_report": {
        const rows = await this.getDepartmentPerformance(districtId);
        return {
          type,
          title: "Department Report",
          period: `${districtName} · ${period}`,
          summary: [{ label: "Departments", value: rows.length }],
          table: {
            columns: ["Department", "Hospitals", "Patients", "Completed", "Waiting", "Avg Wait (min)"],
            rows: rows.map((r) => [r.departmentName, r.hospitals, r.patients, r.completed, r.waiting, r.avgWaitMinutes]),
          },
        };
      }
      case "queue_waiting": {
        const rows = await this.getQueueMonitor(districtId);
        const filtered = filters.hospitalId ? rows.filter((r) => r.hospitalId === filters.hospitalId) : rows;
        return {
          type,
          title: "Queue & Waiting Report",
          period: `${districtName} · Now`,
          summary: [
            { label: "OPD Sessions", value: filtered.length },
            { label: "Waiting", value: filtered.reduce((s, r) => s + r.waiting, 0) },
          ],
          table: {
            columns: ["Hospital", "Department", "Status", "Now Serving", "Waiting"],
            rows: filtered.map((r) => [r.hospitalName, r.departmentName, r.status, r.nowServing ?? "—", r.waiting]),
          },
        };
      }
      case "appointment_report": {
        const all = await appointmentsAsync();
        const scoped = appointmentsInRange(all, filters.dateRange).filter(
          (a) => listHospitalsByDistrict(districtId).some((h) => h.id === a.hospitalId)
        );
        const byStatus = new Map<string, number>();
        for (const a of scoped) byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);
        return {
          type,
          title: "Appointment Report",
          period: `${districtName} · ${period}`,
          summary: [
            { label: "Appointments", value: scoped.length },
            { label: "No-shows", value: byStatus.get("no_show") ?? 0 },
            { label: "Cancelled", value: byStatus.get("cancelled") ?? 0 },
          ],
          table: {
            columns: ["Status", "Count"],
            rows: [...byStatus.entries()].map(([status, count]) => [status.replace("_", " "), count]),
          },
        };
      }
      case "service_utilization": {
        const matrix = await this.getServiceMatrix(districtId);
        return {
          type,
          title: "Service Utilization Report",
          period: `${districtName} · Current`,
          summary: [
            { label: "Services", value: matrix.rows.length },
            { label: "Hospitals", value: matrix.hospitals.length },
          ],
          table: {
            columns: ["Service", "Code", "Hospitals Providing", "Coverage %"],
            rows: matrix.rows.map((r) => [
              r.serviceName,
              r.code,
              r.providerHospitalIds.length,
              `${Math.round((r.providerHospitalIds.length / Math.max(1, matrix.hospitals.length)) * 100)}%`,
            ]),
          },
        };
      }
      case "staff_availability": {
        const rows = await this.getResourceSummary(districtId);
        return {
          type,
          title: "Staff Availability Report",
          period: `${districtName} · Today`,
          summary: [
            { label: "Doctors", value: rows.reduce((s, r) => s + r.doctorsTotal, 0) },
            { label: "Available Today", value: rows.reduce((s, r) => s + r.doctorsAvailable, 0) },
          ],
          table: {
            columns: ["Hospital", "Doctors", "Available", "Nurses", "Lab Staff", "Pharmacy Staff"],
            rows: rows.map((r) => [r.hospitalName, r.doctorsTotal, r.doctorsAvailable, r.nurses, r.labStaff, r.pharmacyStaff]),
          },
        };
      }
      case "hospital_capacity": {
        const rows = await this.getCapacity(districtId);
        return {
          type,
          title: "Hospital Capacity Report",
          period: `${districtName} · Today`,
          summary: [
            { label: "Dept Sessions", value: rows.length },
            { label: "Exceeded", value: rows.filter((r) => r.status === "exceeded").length },
            { label: "Near Capacity", value: rows.filter((r) => r.status === "near_capacity").length },
          ],
          table: {
            columns: ["Hospital", "Department", "Expected", "Appointments", "Walk-ins", "Total", "Utilization"],
            rows: rows.map((r) => [
              r.hospitalName,
              r.departmentName,
              r.expectedCapacity,
              r.appointments,
              r.walkIns,
              r.total,
              `${r.utilizationPercent}%`,
            ]),
          },
        };
      }
      case "referral_summary":
      default: {
        const referrals = await this.getReferrals(districtId);
        return {
          type: "referral_summary",
          title: "Referral Summary",
          period: `${districtName} · ${period}`,
          summary: [
            { label: "Flows", value: referrals.length },
            { label: "Total Referrals", value: referrals.reduce((s, r) => s + r.count, 0) },
          ],
          table: {
            columns: ["From", "To", "Referrals"],
            rows: referrals.map((r) => [r.fromHospitalName, r.toHospitalName, r.count]),
          },
        };
      }
    }
  },
};

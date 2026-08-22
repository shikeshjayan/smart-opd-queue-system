import type {
  EmergencyMode,
  ScheduledReport,
  StateAnnouncement,
  StateAuditAction,
  StateAuditEvent,
  StateConfig,
  StateUserRow,
  SystemHealthData,
  SystemHealthItem,
  SystemHealthStatus,
  StateFilters,
  StateStats,
  DistrictComparisonRow,
  HospitalType,
  StateHospitalRow,
  StateServiceAvailabilityRow,
  StateCapacityRow,
  StateAlertSummary,
} from "./types";
import { DISTRICTS, getDistrictName, type DistrictId } from "@/config/districts";
import {
  countCompletedTokensByHospital,
  countTokensByHospital,
  countWaitingByHospital,
  listAllAlerts,
  listHospitalsByDistrict,
  mockDistrictPerformance,
} from "@/services/data";
import { hospitalOpsService } from "@/services/hospital-ops";

const STORE_KEY = "smart-health.state.v1";
const delay = () => new Promise((resolve) => setTimeout(resolve, 300));
const LOAD_THRESHOLDS = { highLoad: 20, alert: 40 };
const CAPACITY_PER_OPD = 150;

type StateStore = {
  announcements: StateAnnouncement[];
  audit: StateAuditEvent[];
  users: StateUserRow[];
  settings: {
    config: StateConfig;
    emergencyMode: EmergencyMode;
    scheduledReports: ScheduledReport[];
  };
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadStatus(waiting: number): "normal" | "high_load" | "alert" {
  if (waiting >= LOAD_THRESHOLDS.alert) return "alert";
  if (waiting >= LOAD_THRESHOLDS.highLoad) return "high_load";
  return "normal";
}

function hospitalTypeFor(name: string): HospitalType {
  const n = name.toLowerCase();
  if (n.startsWith("gh ") || n.startsWith("government")) return "government_hospital";
  if (n.includes("medical college")) return "medical_college";
  if (n.includes("district")) return "district_hospital";
  return "general_hospital";
}

function seedStore(): StateStore {
  const today = todayISO();
  const users: StateUserRow[] = [
    { id: "sadm_001", name: "Dr. A. Radhakrishnan", role: "State Admin", status: "active", lastLogin: `${today}T09:15:00` },
    { id: "dadm_001", name: "K. P. Vishwanath", role: "District Admin", districtId: "ernakulam" as DistrictId, status: "active", lastLogin: `${today}T08:30:00` },
    { id: "adm_001", name: "Dr. Sreeja Nambiar", role: "Hospital Admin", districtId: "ernakulam" as DistrictId, hospitalId: "hos_001", status: "active", lastLogin: `${today}T07:45:00` },
    { id: "doc_001", name: "Dr. Anil Kumar", role: "Doctor", status: "active", lastLogin: `${today}T08:00:00` },
    { id: "stf_001", name: "Radhika Menon", role: "Receptionist", status: "active", lastLogin: `${today}T08:00:00` },
    { id: "stf_002", name: "Sindhu Thomas", role: "Nurse", status: "active", lastLogin: `${today}T07:45:00` },
    { id: "lab_001", name: "Deepa S", role: "Lab Staff", status: "active", lastLogin: `${today}T07:50:00` },
  ];

  return {
    announcements: [
      {
        id: "sa_1",
        title: "Independence Day OPD Closure",
        message: "All government hospitals will have limited OPD services on 15th August.",
        status: "published",
        targetType: "all",
        targetIds: [],
        publishedAt: `${today}T08:00:00`,
        scheduledAt: null,
        expiresAt: null,
        publishedBy: "Dr. A. Radhakrishnan",
        createdAt: `${today}T08:00:00`,
      },
      {
        id: "sa_2",
        title: "Dengue Alert Protocol",
        message: "Strict adherence to dengue management protocols advised.",
        status: "published",
        targetType: "all",
        targetIds: [],
        publishedAt: `${today}T09:00:00`,
        scheduledAt: null,
        expiresAt: null,
        publishedBy: "Dr. A. Radhakrishnan",
        createdAt: `${today}T09:00:00`,
      },
    ],
    audit: [
      {
        id: "saud_1",
        at: `${today}T10:00:00`,
        actorId: "sadm_001",
        actorName: "Dr. A. Radhakrishnan",
        actorRole: "State Admin",
        action: "announcement_published",
        targetType: "announcement",
        targetId: "sa_1",
        summary: "Published: Independence Day OPD Closure",
        result: "success",
      },
    ],
    users,
    settings: {
      config: {
        hospitalTypes: ["Government Hospital", "Medical College", "General Hospital", "District Hospital"],
        standardDepartments: ["General Medicine", "Pediatrics", "Cardiology", "Orthopedics", "Ophthalmology", "ENT"],
        standardServices: ["OPD", "Laboratory", "Pharmacy", "Diagnostics", "Radiology", "Emergency"],
        permissions: { state_admin: ["MANAGE_STATE_SETTINGS", "VIEW_STATE_DATA"], district_admin: ["VIEW_DISTRICT_DATA"] },
        notificationRules: { highWaitThreshold: 20, criticalWaitThreshold: 40 },
      },
      emergencyMode: { active: false, scope: "state" },
      scheduledReports: [
        {
          id: "sr_1",
          reportType: "opd_performance",
          title: "Monthly State OPD Report",
          schedule: "monthly",
          recipients: ["State Health Administration"],
          format: "csv",
          nextRunAt: new Date(Date.now() + 30 * 86400000).toISOString(),
          status: "active",
        },
      ],
    },
  };
}

let cachedStore: StateStore | null = null;
function ensureLoaded(): StateStore {
  if (cachedStore) return cachedStore;
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      try {
        cachedStore = JSON.parse(raw);
        return cachedStore!;
      } catch {
        localStorage.removeItem(STORE_KEY);
      }
    }
  }
  cachedStore = seedStore();
  persistStore();
  return cachedStore!;
}
function persistStore(): void {
  if (!cachedStore || typeof window === "undefined") return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(cachedStore));
  } catch { /* private mode */ }
}

function pushAudit(
  action: StateAuditAction,
  targetType: string,
  targetId: string,
  summary: string,
  result: "success" | "failure",
  actor?: { id: string; name: string; role: string }
): void {
  const store = ensureLoaded();
  store.audit.unshift({
    id: `saud_${Date.now()}_${store.audit.length}`,
    at: new Date().toISOString(),
    actorId: actor?.id ?? "system",
    actorName: actor?.name ?? "System",
    actorRole: actor?.role ?? "System",
    action,
    targetType,
    targetId,
    summary,
    result,
  });
  persistStore();
}

function healthFor(waiting: number): QueueHealth {
    if (waiting >= LOAD_THRESHOLDS.alert) return "critical";
    if (waiting >= LOAD_THRESHOLDS.highLoad) return "warning";
    return "healthy";
}

export const stateAdminService = {
  async getStateStats(): Promise<StateStats> {
    await delay();
    const perf = [...mockDistrictPerformance];
    return {
      stateName: "Kerala",
      districts: perf.length,
      hospitals: perf.reduce((s, d) => s + d.hospitals, 0),
      patientsToday: perf.reduce((s, d) => s + d.patientsToday, 0),
      opdConsultations: perf.reduce((s, d) => s + d.completed, 0),
      appointments: 32841,
      waiting: perf.reduce((s, d) => s + d.waiting, 0),
      activeOpds: 3921,
      avgWaitMinutes: Math.round(perf.reduce((s, d) => s + d.avgWaitMinutes, 0) / perf.length),
      statuses: {
        normal: perf.filter((p) => p.longestQueue === null).length,
        highLoad: perf.filter((p) => p.longestQueue !== null).length,
        alert: 0,
      },
    };
  },

  async listDistrictComparison(): Promise<DistrictComparisonRow[]> {
    await delay();
    return mockDistrictPerformance
      .sort((a, b) => b.patientsToday - a.patientsToday)
      .map((d, i) => ({
        districtId: d.districtId,
        districtName: d.districtName,
        hospitals: d.hospitals,
        patients: d.patientsToday,
        waiting: d.waiting,
        avgWaitMinutes: d.avgWaitMinutes,
        completed: d.completed,
        status: healthFor(d.avgWaitMinutes),
      }));
  },

  async listHospitalDirectory(filters: StateFilters & {query?:string}): Promise<StateHospitalRow[]> {
    await delay();
    const allHospitals = DISTRICTS.flatMap(d => listHospitalsByDistrict(d.id));
    const filtered = allHospitals.filter(h => {
        if (filters.districtId && h.district !== filters.districtId) return false;
        if (filters.query && !h.name.toLowerCase().includes(filters.query.toLowerCase())) return false;
        return true;
    });
    return filtered.map(h => {
        const waiting = countWaitingByHospital(h.id);
        return {
            hospitalId: h.id,
            name: h.name,
            districtId: h.district,
            districtName: getDistrictName(h.district),
            type: hospitalTypeFor(h.name),
            status: h.status,
            patients: countTokensByHospital(h.id),
            waiting,
            completed: countCompletedTokensByHospital(h.id),
            avgWaitMinutes: 30, // Simplified for mock data
            servicesCount: 5,
            load: loadStatus(waiting),
        };
    });
  },

  async getServiceAvailability(): Promise<StateServiceAvailabilityRow[]> {
      await delay();
      const allHospitals = DISTRICTS.flatMap(d => listHospitalsByDistrict(d.id));
      const services = new Map<string, {hospitalCount: number, districtCount: Set<string>}>();
      for (const h of allHospitals) {
          const srv = await hospitalOpsService.listServices(h.id);
          for (const s of srv) {
              if (s.status !== 'active') continue;
              const entry = services.get(s.name) || {hospitalCount: 0, districtCount: new Set()};
              entry.hospitalCount++;
              entry.districtCount.add(h.district);
              services.set(s.name, entry);
          }
      }
      return [...services.entries()].map(([name, data]) => ({
          serviceName: name,
          code: name.toUpperCase().slice(0, 3),
          hospitalCount: data.hospitalCount,
          districtCount: data.districtCount.size,
      }));
  },

  async getCapacityByDistrict(): Promise<StateCapacityRow[]> {
      await delay();
      return DISTRICTS.map(d => {
          const perf = mockDistrictPerformance.find(p => p.districtId === d.id);
          const load = perf?.patientsToday || 0;
          const hospitals = listHospitalsByDistrict(d.id);
          const capacity = hospitals.length * CAPACITY_PER_OPD;
          const util = (load / capacity) * 100;
          return {
              districtId: d.id,
              districtName: d.name,
              opdCapacity: capacity,
              todaysLoad: load,
              utilizationPercent: Math.round(util),
              status: util > 100 ? "exceeded" : util >= 85 ? "near_capacity" : "normal",
  async getReport(type: StateReportType): Promise<{
    type: StateReportType;
    title: string;
    period: string;
    summary: Array<{ label: string; value: string | number }>;
    columns: string[];
    rows: Array<Record<string, string | number>>;
  }> {
    await delay();
    return {
      type,
      title: type.replace(/_/g, " "),
      period: "Today",
      summary: [{ label: "Total", value: 100 }],
      columns: ["Metric", "Value"],
      rows: [{ Metric: "Example", Value: 100 }],
    };
  },
};

      });
  },

  async listAnnouncements(): Promise<StateAnnouncement[]> {
    await delay();
    return ensureLoaded().announcements.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async publishAnnouncement(
    input: Omit<StateAnnouncement, "id" | "status" | "createdAt" | "publishedBy">,
    actor: { id: string; name: string; role: string }
  ): Promise<StateAnnouncement> {
    await delay();
    const store = ensureLoaded();
    const announcement: StateAnnouncement = {
      ...input,
      id: `ann_${Date.now()}`,
      status: "published",
      publishedAt: new Date().toISOString(),
      publishedBy: actor.name,
      createdAt: new Date().toISOString(),
    };
    store.announcements.unshift(announcement);
    persistStore();
    pushAudit("announcement_published", "announcement", announcement.id, announcement.title, "success", actor);
    return announcement;
  },

  async getAlertsSummary(): Promise<StateAlertSummary> {
    await delay();
    const alerts = listAllAlerts().filter((a) => a.status === "active");
    return {
      critical: alerts.filter((a) => a.severity === "critical").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      notice: alerts.filter((a) => a.severity === "info").length,
      items: alerts,
    };
  },

  async getUsers(): Promise<StateUserRow[]> {
    await delay();
    return ensureLoaded().users;
  },

  async getAuditLog(): Promise<StateAuditEvent[]> {
    await delay();
    return ensureLoaded().audit;
  },

  async getAlertsSummary(): Promise<StateAlertSummary> {
    await delay();
    const items = listAllAlerts().filter((a) => a.status === "active");
    return {
      critical: items.filter((a) => a.severity === "critical").length,
      warning: items.filter((a) => a.severity === "warning").length,
      notice: items.filter((a) => a.severity === "info").length,
      items,
    };
  },

  async getUsers(): Promise<StateUserRow[]> {
    await delay();
    return ensureLoaded().users;
  },

  async getSystemHealth(): Promise<SystemHealthData> {
    await delay();
    const lastCheckedAt = new Date().toISOString();
    const services: SystemHealthItem[] = [
      { id: "svc_queue", service: "OPD Queue Engine", status: "healthy", lastCheckedAt },
      { id: "svc_appointments", service: "Appointment Service", status: "healthy", lastCheckedAt },
      { id: "svc_notifications", service: "Notification Gateway", status: "degraded", lastCheckedAt, detail: "SMS delivery delays reported in two districts" },
      { id: "svc_analytics", service: "Analytics Pipeline", status: "healthy", lastCheckedAt },
      { id: "svc_reports", service: "Report Generator", status: "healthy", lastCheckedAt },
    ];
    const overall: SystemHealthStatus = services.some((s) => s.status === "down")
      ? "down"
      : services.some((s) => s.status === "degraded")
        ? "degraded"
        : "healthy";
    return { overall, services, incidents: [] };
  },

  async getConfig(): Promise<StateConfig> {
    await delay();
    return ensureLoaded().settings.config;
  },
};

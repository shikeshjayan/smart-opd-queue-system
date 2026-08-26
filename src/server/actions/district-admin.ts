"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  HospitalModel,
  DepartmentModel,
  DoctorModel,
  StaffModel,
  OpdSessionModel,
  QueueEntryModel,
  HospitalServiceModel,
  NotificationModel,
  AuditLogModel,
  AdminSettingsModel,
  StaffAssignmentModel,
  StaffLeaveModel,
  plain,
  plainList,
} from "@/lib/models";
import type { DistrictId } from "@/config/districts";
import { getDistrictName } from "@/config/districts";
import type {
  Announcement,
  CapacityRow,
  ComparisonRow,
  DistrictAuditEvent,
  DistrictFilters,
  DistrictHospitalRow,
  DistrictReportType,
  DistrictSettings,
  DistrictStats,
  DoctorAvailabilityRow,
  MapPoint,
  OpdAnalyticsData,
  ReferralFlow,
  ResourceSummaryRow,
  ServiceAvailabilityRow,
} from "@/services/district/types";
import { DEFAULT_DISTRICT_FILTERS } from "@/services/district/types";

const LOAD_THRESHOLDS = { highLoad: 20, alert: 40 };

const DISTRICT_MAP_POINTS: MapPoint[] = [
  { hospitalId: "hos_001", x: 58, y: 56 },
  { hospitalId: "hos_005", x: 46, y: 36 },
  { hospitalId: "hos_006", x: 64, y: 28 },
  { hospitalId: "hos_008", x: 42, y: 52 },
  { hospitalId: "hos_009", x: 36, y: 44 },
  { hospitalId: "hos_010", x: 55, y: 42 },
  { hospitalId: "hos_011", x: 48, y: 58 },
  { hospitalId: "hos_012", x: 38, y: 38 },
];

function mapPointFor(hospitalId: string, index: number): MapPoint {
  const known = DISTRICT_MAP_POINTS.find((p) => p.hospitalId === hospitalId);
  if (known) return known;
  return { hospitalId, x: 30 + ((index * 17) % 45), y: 25 + ((index * 23) % 40) };
}

function loadStatus(waiting: number): "normal" | "high_load" | "alert" {
  if (waiting > LOAD_THRESHOLDS.alert) return "alert";
  if (waiting > LOAD_THRESHOLDS.highLoad) return "high_load";
  return "normal";
}

async function getHospitalsForDistrict(districtId: DistrictId) {
  await dbConnect();
  return HospitalModel.find({ district: districtId }).lean();
}

async function getHospitalRows(districtId: DistrictId): Promise<DistrictHospitalRow[]> {
  const hospitals = await getHospitalsForDistrict(districtId);
  const rows: DistrictHospitalRow[] = [];

  for (let i = 0; i < hospitals.length; i++) {
    const h = hospitals[i];
    const hid = String(h._id);
    const opds = await OpdSessionModel.find({ hospitalId: hid }).lean();
    const opdIds = opds.map((o) => String(o._id ?? ""));

    let waiting = 0;
    let completed = 0;
    let patients = 0;

    if (opdIds.length > 0) {
      const entries = await QueueEntryModel.find({ opdId: { $in: opdIds } }).lean();
      for (const e of entries) {
        patients++;
        if (e.status === "waiting" || e.status === "called") waiting++;
        if (e.status === "completed") completed++;
      }
    }

    const deptCount = await DepartmentModel.countDocuments({ hospitalId: hid });
    const doctorCount = await DoctorModel.countDocuments({ hospitalId: hid });
    const status = loadStatus(waiting);
    const avgWaitMinutes = completed > 0 ? Math.round((waiting * 15) / completed) : 0;

    rows.push({
      hospitalId: hid,
      name: String(h.name ?? ""),
      address: String(h.address ?? ""),
      phone: String(h.phone ?? ""),
      patients,
      waiting,
      completed,
      avgWaitMinutes,
      activeOpds: opdIds.length,
      departments: deptCount,
      doctors: doctorCount,
      status,
    });
  }

  return rows;
}

export async function getDistrictDashboard(districtId: DistrictId, filters: DistrictFilters = DEFAULT_DISTRICT_FILTERS) {
  const rows = await getHospitalRows(districtId);
  const totalPatients = rows.reduce((s, r) => s + r.patients, 0);
  const totalWaiting = rows.reduce((s, r) => s + r.waiting, 0);
  const statuses = { normal: 0, highLoad: 0, alert: 0 };
  for (const r of rows) {
    if (r.status === "alert") statuses.alert++;
    else if (r.status === "high_load") statuses.highLoad++;
    else statuses.normal++;
  }

  const announcements = await listDistrictAnnouncements(districtId);
  const alerts = rows.filter((r) => r.status === "alert").map((r) => ({
    id: `alert_${r.hospitalId}`,
    title: `High load at ${r.name}`,
    message: `${r.waiting} patients waiting`,
    severity: "warning" as const,
    hospitalId: r.hospitalId,
  }));

  const longestQueue = rows.reduce(
    (best, r) => (!best || r.waiting > best.waiting ? r : best),
    null as DistrictHospitalRow | null
  );

  return {
    districtId,
    districtName: getDistrictName(districtId),
    performance: {
      totalPatients,
      totalWaiting,
      avgWaitMinutes: rows.length ? Math.round(rows.reduce((s, r) => s + r.avgWaitMinutes, 0) / rows.length) : 0,
    },
    hospitals: rows,
    alerts,
    longestQueue,
    announcements,
  };
}

export async function getDistrictAnalytics(districtId: DistrictId, period: OpdAnalyticsData["period"], filters: DistrictFilters = DEFAULT_DISTRICT_FILTERS): Promise<OpdAnalyticsData> {
  const hospitals = await getHospitalsForDistrict(districtId);
  const hospitalIds = hospitals.map((h) => String(h._id));
  const sessions = hospitalIds.length > 0 ? await OpdSessionModel.find({ hospitalId: { $in: hospitalIds } }).lean() : [];

  const deptMap = new Map<string, { departmentName: string; patients: number; completed: number; waiting: number }>();
  for (const s of sessions) {
    const deptId = String(s.departmentId ?? "unknown");
    if (!deptMap.has(deptId)) deptMap.set(deptId, { departmentName: deptId, patients: 0, completed: 0, waiting: 0 });
    const d = deptMap.get(deptId)!;
    d.patients++;
    d.completed += (s.tokensCompleted as number) ?? 0;
  }

  const departmentVolume = Array.from(deptMap.values()).map((d) => ({
    departmentName: d.departmentName,
    visits: d.patients,
  }));

  const totalVisits = departmentVolume.reduce((s, d) => s + d.visits, 0);
  const totalCompleted = Array.from(deptMap.values()).reduce((s, d) => s + d.completed, 0);
  return {
    period,
    periodLabel: period === "today" ? "Today" : period === "weekly" ? "This Week" : "This Month",
    totalVisits,
    appointments: Math.round(totalVisits * 0.3),
    walkIns: Math.round(totalVisits * 0.7),
    completedConsultations: totalCompleted,
    noShows: 0,
    avgWaitMinutes: departmentVolume.length ? Math.round(departmentVolume.reduce((s, d) => s + d.visits, 0) / departmentVolume.length) : 0,
    avgConsultationMinutes: 15,
    departmentVolume,
  };
}

export async function listDistrictHospitalRows(districtId: DistrictId): Promise<DistrictHospitalRow[]> {
  return getHospitalRows(districtId);
}

export async function getDistrictComparison(districtId: DistrictId): Promise<ComparisonRow[]> {
  const rows = await getHospitalRows(districtId);
  const sorted = [...rows].sort((a, b) => b.patients - a.patients);
  return sorted.map((r, i) => ({
    rank: i + 1,
    hospitalId: r.hospitalId,
    name: r.name,
    patients: r.patients,
    waiting: r.waiting,
    avgWaitMinutes: r.avgWaitMinutes,
  }));
}

export async function getDistrictCapacity(districtId: DistrictId): Promise<CapacityRow[]> {
  const hospitals = await getHospitalsForDistrict(districtId);
  const result: CapacityRow[] = [];

  for (const h of hospitals) {
    const hid = String(h._id);
    const departments = await DepartmentModel.find({ hospitalId: hid }).lean();
    for (const dept of departments) {
      const deptId = String(dept._id);
      const deptName = String(dept.name ?? "Unknown");
      const today = new Date().toISOString().slice(0, 10);
      const sessions = await OpdSessionModel.find({ hospitalId: hid, departmentId: deptId, date: today }).lean();
      const total = sessions.reduce((s, se) => s + ((se.plannedCapacity as number) ?? 0), 0);
      const appointments = sessions.reduce((s, se) => s + ((se.tokensIssued as number) ?? 0), 0);
      const walkIns = Math.max(0, total - appointments);
      const expectedCapacity = Math.max(total, 20);
      const utilizationPercent = Math.min(100, Math.round((appointments / expectedCapacity) * 100));
      const status: CapacityRow["status"] = utilizationPercent > 100 ? "exceeded" : utilizationPercent >= 85 ? "near_capacity" : "normal";

      result.push({ hospitalId: hid, hospitalName: String(h.name ?? ""), departmentId: deptId, departmentName: deptName, expectedCapacity, appointments, walkIns, total, utilizationPercent, status });
    }
  }

  return result;
}

export async function getDistrictResources(districtId: DistrictId): Promise<ResourceSummaryRow[]> {
  const hospitals = await getHospitalsForDistrict(districtId);
  const hospitalIds = hospitals.map((h) => String(h._id));
  const result: ResourceSummaryRow[] = [];

  for (const h of hospitals) {
    const hid = String(h._id);
    const doctorCount = await DoctorModel.countDocuments({ hospitalId: hid });
    const staffCount = await StaffModel.countDocuments({ hospitalId: hid });
    const serviceCount = await HospitalServiceModel.countDocuments({ hospitalId: hid, status: "active" });
    const assignmentCount = await StaffAssignmentModel.countDocuments({ hospitalId: hid });

    result.push({
      hospitalId: hid,
      hospitalName: String(h.name ?? ""),
      doctorsTotal: doctorCount,
      doctorsAvailable: doctorCount,
      nurses: Math.round(staffCount * 0.4),
      labStaff: Math.round(staffCount * 0.15),
      pharmacyStaff: Math.round(staffCount * 0.15),
      otherStaff: Math.max(0, staffCount - Math.round(staffCount * 0.7)),
      servicesActive: serviceCount,
    });
  }

  return result;
}

export async function getHospitalDoctorAvailability(hospitalId: string): Promise<DoctorAvailabilityRow[]> {
  await dbConnect();
  const departments = await DepartmentModel.find({ hospitalId }).lean();
  const result: DoctorAvailabilityRow[] = [];

  for (const dept of departments) {
    const deptId = String(dept._id);
    const deptName = String(dept.name ?? "Unknown");
    const doctors = await DoctorModel.find({ hospitalId, departmentId: deptId }).lean();
    const doctorNames = doctors.map((d) => String(d.name ?? "Doctor"));

    result.push({
      departmentId: deptId,
      departmentName: deptName,
      available: doctors.length,
      onLeave: 0,
      unavailable: 0,
      doctorNames,
    });
  }

  return result;
}

export async function getDistrictServiceMatrix(districtId: DistrictId): Promise<ServiceAvailabilityRow[]> {
  const hospitals = await getHospitalsForDistrict(districtId);
  const hospitalIds = hospitals.map((h) => String(h._id));
  const services = hospitalIds.length > 0 ? await HospitalServiceModel.find({ hospitalId: { $in: hospitalIds } }).lean() : [];

  const serviceMap = new Map<string, { serviceName: string; code: string; providerHospitalIds: string[] }>();
  for (const s of services) {
    const name = String(s.name ?? "Unknown");
    const code = String(s.code ?? name.slice(0, 3).toUpperCase());
    if (!serviceMap.has(code)) serviceMap.set(code, { serviceName: name, code, providerHospitalIds: [] });
    serviceMap.get(code)!.providerHospitalIds.push(String(s.hospitalId));
  }

  return Array.from(serviceMap.values());
}

export async function getDistrictReferrals(districtId: DistrictId): Promise<ReferralFlow[]> {
  const hospitals = await getHospitalsForDistrict(districtId);
  if (hospitals.length < 2) return [];
  const h1 = hospitals[0], h2 = hospitals[1];
  return [
    { id: "ref_1", fromHospitalId: String(h1._id), fromHospitalName: String(h1.name ?? ""), toHospitalId: String(h2._id), toHospitalName: String(h2.name ?? ""), count: 12, periodLabel: "This Month" },
    { id: "ref_2", fromHospitalId: String(h2._id), fromHospitalName: String(h2.name ?? ""), toHospitalId: String(h1._id), toHospitalName: String(h1.name ?? ""), count: 8, periodLabel: "This Month" },
  ];
}

export async function listDistrictAnnouncements(districtId: DistrictId): Promise<Announcement[]> {
  await dbConnect();
  const docs = await NotificationModel.find({ type: "announcement", districtId }).sort({ createdAt: -1 }).limit(20).lean();
  return docs.map((d) => ({
    id: String(d._id),
    title: String(d.title ?? ""),
    message: String(d.message ?? ""),
    audience: (d.audience as Announcement["audience"]) ?? "hospitals",
    targetIds: Array.isArray(d.targetIds) ? d.targetIds : [],
    publishedAt: String(d.createdAt ?? ""),
    publishedBy: String(d.createdBy ?? "System"),
    status: "published" as const,
  }));
}

export async function publishDistrictAnnouncement(districtId: DistrictId, input: { title: string; message: string; audience: string; targetIds?: string[] }): Promise<Announcement> {
  await dbConnect();
  const doc = await NotificationModel.create({
    type: "announcement",
    districtId,
    title: input.title,
    message: input.message,
    audience: input.audience,
    targetIds: input.targetIds ?? [],
    status: "published",
    createdAt: new Date().toISOString(),
    createdBy: "District Admin",
  });
  return {
    id: String(doc._id),
    title: input.title,
    message: input.message,
    audience: input.audience as Announcement["audience"],
    targetIds: input.targetIds ?? [],
    publishedAt: new Date().toISOString(),
    publishedBy: "District Admin",
    status: "published",
  };
}

export async function listDistrictAudit(districtId: DistrictId): Promise<DistrictAuditEvent[]> {
  await dbConnect();
  const docs = await AuditLogModel.find({ districtId }).sort({ createdAt: -1 }).limit(50).lean();
  return docs.map((d) => ({
    id: String(d._id),
    at: String(d.createdAt ?? ""),
    actorId: String(d.actorId ?? ""),
    actorName: String(d.actorName ?? "System"),
    actorRole: String(d.actorRole ?? "system"),
    action: String(d.action ?? "") as DistrictAuditEvent["action"],
    targetType: String(d.resourceType ?? ""),
    targetId: String(d.resourceId ?? ""),
    summary: typeof d.detail === "object" ? JSON.stringify(d.detail) : String(d.detail ?? ""),
  }));
}

export async function getDistrictSettings(districtId: DistrictId): Promise<DistrictSettings> {
  return {
    reporting: { aggregateOnly: false, includeWalkInsInReports: true, weeklyReportDay: "monday" },
    serviceCatalogueVisible: true,
    hospitalActivationOverrides: {},
  };
}

export async function saveDistrictSettings(districtId: DistrictId, settings: DistrictSettings): Promise<DistrictSettings> {
  return settings;
}

export async function getDistrictReport(districtId: DistrictId, type: DistrictReportType, filters: DistrictFilters = DEFAULT_DISTRICT_FILTERS) {
  const rows = await getHospitalRows(districtId);
  return {
    type,
    title: `District ${type.replace(/_/g, " ")} Report`,
    period: filters.dateRange,
    summary: [
      { label: "Hospitals", value: rows.length },
      { label: "Patients", value: rows.reduce((s, r) => s + r.patients, 0) },
      { label: "Waiting", value: rows.reduce((s, r) => s + r.waiting, 0) },
    ],
    columns: ["Hospital", "Patients", "Waiting", "Completed", "Avg Wait", "Status"],
    rows: rows.map((r) => ({ name: r.name, patients: r.patients, waiting: r.waiting, completed: r.completed, avgWait: r.avgWaitMinutes, status: r.status })),
  };
}

export async function toggleDistrictHospitalActive(hospitalId: string): Promise<void> {
  await dbConnect();
  const doc = await HospitalModel.findById(hospitalId).lean();
  if (!doc) throw new Error("Hospital not found");
  const newStatus = doc.status === "active" ? "inactive" : "active";
  await HospitalModel.updateOne({ _id: hospitalId }, { $set: { status: newStatus } });
}

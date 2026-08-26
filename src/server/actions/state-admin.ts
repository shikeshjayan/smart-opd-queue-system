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
  GovernmentAlertModel,
  AdminSettingsModel,
  plain,
  plainList,
} from "@/lib/models";
import { DISTRICTS, getDistrictName, type DistrictId } from "@/config/districts";
import type {
  StateStats,
  DistrictComparisonRow,
  StateHospitalRow,
  StateServiceAvailabilityRow,
  StateCapacityRow,
  StateAnnouncement,
  StateAuditEvent,
  StateFilters,
  StateAlertSummary,
  QueueHealth,
  ResourceTotals,
} from "@/services/state/types";

function loadStatus(waiting: number): "normal" | "high_load" | "alert" {
  if (waiting > 40) return "alert";
  if (waiting > 20) return "high_load";
  return "normal";
}

function queueHealth(waiting: number, total: number): QueueHealth {
  const ratio = total > 0 ? waiting / total : 0;
  if (ratio > 0.5 || waiting > 50) return "critical";
  if (ratio > 0.2 || waiting > 20) return "warning";
  return "healthy";
}

function mapHospitalType(t?: string): "government_hospital" | "medical_college" | "general_hospital" | "district_hospital" {
  if (t === "medical_college") return "medical_college";
  if (t === "district") return "district_hospital";
  if (t === "specialty") return "general_hospital";
  return "government_hospital";
}

async function getDistrictAggregates() {
  await dbConnect();
  const districts = DISTRICTS;
  const result: Array<{ districtId: DistrictId; hospitals: number; patients: number; waiting: number; completed: number; avgWaitMinutes: number }> = [];

  for (const d of DISTRICTS) {
    const districtId = d.id as DistrictId;
    const hospitals = await HospitalModel.find({ district: districtId }).lean();
    const hospitalIds = hospitals.map((h) => String(h._id));
    let patients = 0;
    let waiting = 0;
    let completed = 0;

    if (hospitalIds.length > 0) {
      const opds = await OpdSessionModel.find({ hospitalId: { $in: hospitalIds } }).lean();
      const opdIds = opds.map((o) => String(o._id ?? ""));
      if (opdIds.length > 0) {
        const entries = await QueueEntryModel.find({ opdId: { $in: opdIds } }).lean();
        for (const e of entries) {
          patients++;
          if (e.status === "waiting" || e.status === "called") waiting++;
          if (e.status === "completed") completed++;
        }
      }
    }

    const avgWait = completed > 0 ? Math.round((waiting * 15) / completed) : 0;
    result.push({ districtId, hospitals: hospitals.length, patients, waiting, completed, avgWaitMinutes: avgWait });
  }

  return result;
}

export async function getStateStats(): Promise<StateStats> {
  const agg = await getDistrictAggregates();
  const totalHospitals = agg.reduce((s, a) => s + a.hospitals, 0);
  const totalPatients = agg.reduce((s, a) => s + a.patients, 0);
  const totalWaiting = agg.reduce((s, a) => s + a.waiting, 0);
  const statuses = { normal: 0, highLoad: 0, alert: 0 };
  for (const a of agg) {
    const st = loadStatus(a.waiting);
    if (st === "alert") statuses.alert++;
    else if (st === "high_load") statuses.highLoad++;
    else statuses.normal++;
  }

  return {
    stateName: "Kerala",
    districts: DISTRICTS.length,
    hospitals: totalHospitals,
    patientsToday: totalPatients,
    opdConsultations: totalPatients,
    appointments: Math.round(totalPatients * 0.3),
    waiting: totalWaiting,
    activeOpds: totalHospitals * 3,
    avgWaitMinutes: agg.length ? Math.round(agg.reduce((s, a) => s + a.avgWaitMinutes, 0) / agg.length) : 0,
    statuses,
  };
}

export async function listDistrictComparison(): Promise<DistrictComparisonRow[]> {
  const agg = await getDistrictAggregates();
  return agg.map((a) => ({
    districtId: a.districtId,
    districtName: getDistrictName(a.districtId),
    hospitals: a.hospitals,
    patients: a.patients,
    waiting: a.waiting,
    avgWaitMinutes: a.avgWaitMinutes,
    completed: a.completed,
    status: queueHealth(a.waiting, a.patients),
  }));
}

export async function listHospitalDirectory(filters: StateFilters & { query?: string }): Promise<StateHospitalRow[]> {
  await dbConnect();
  const query: Record<string, unknown> = {};
  if (filters.districtId) query.district = filters.districtId;
  if (filters.query) query.name = { $regex: filters.query, $options: "i" };

  const hospitals = await HospitalModel.find(query).lean();
  const result: StateHospitalRow[] = [];

  for (const h of hospitals) {
    const hid = String(h._id);
    const opds = await OpdSessionModel.find({ hospitalId: hid }).lean();
    const opdIds = opds.map((o) => String(o._id ?? ""));
    let patients = 0, waiting = 0, completed = 0;

    if (opdIds.length > 0) {
      const entries = await QueueEntryModel.find({ opdId: { $in: opdIds } }).lean();
      for (const e of entries) {
        patients++;
        if (e.status === "waiting" || e.status === "called") waiting++;
        if (e.status === "completed") completed++;
      }
    }

    const servicesCount = await HospitalServiceModel.countDocuments({ hospitalId: hid, status: "active" });
    const avgWait = completed > 0 ? Math.round((waiting * 15) / completed) : 0;

    result.push({
      hospitalId: hid,
      name: String(h.name ?? ""),
      districtId: (h.district as DistrictId) ?? "ernakulam",
      districtName: getDistrictName((h.district as DistrictId) ?? "ernakulam"),
      type: mapHospitalType(h.type as string),
      status: (h.status as "active" | "inactive") ?? "active",
      patients,
      waiting,
      completed,
      avgWaitMinutes: avgWait,
      servicesCount,
      load: loadStatus(waiting),
    });
  }

  return result;
}

export async function getServiceAvailability(): Promise<StateServiceAvailabilityRow[]> {
  await dbConnect();
  const services = await HospitalServiceModel.find({ status: "active" }).lean();
  const map = new Map<string, { serviceName: string; code: string; hospitals: Set<string>; districts: Set<string> }>();

  for (const s of services) {
    const name = String(s.name ?? "Unknown");
    const code = String(s.code ?? name.slice(0, 3).toUpperCase());
    if (!map.has(code)) map.set(code, { serviceName: name, code, hospitals: new Set(), districts: new Set() });
    const entry = map.get(code)!;
    entry.hospitals.add(String(s.hospitalId));
    const hospital = await HospitalModel.findById(s.hospitalId).lean();
    if (hospital?.district) entry.districts.add(String(hospital.district));
  }

  return Array.from(map.values()).map((v) => ({
    serviceName: v.serviceName,
    code: v.code,
    hospitalCount: v.hospitals.size,
    districtCount: v.districts.size,
  }));
}

export async function getCapacityByDistrict(): Promise<StateCapacityRow[]> {
  await dbConnect();
  const result: StateCapacityRow[] = [];

  for (const d of DISTRICTS) {
    const districtId = d.id as DistrictId;
    const hospitals = await HospitalModel.find({ district: districtId }).lean();
    const hospitalIds = hospitals.map((h) => String(h._id));
    let load = 0;
    if (hospitalIds.length > 0) {
      const opds = await OpdSessionModel.find({ hospitalId: { $in: hospitalIds } }).lean();
      load = opds.length;
    }
    const capacity = Math.max(hospitals.length * 10, 50);
    const utilPct = Math.min(100, Math.round((load / capacity) * 100));
    const status: "normal" | "near_capacity" | "exceeded" = utilPct > 100 ? "exceeded" : utilPct >= 85 ? "near_capacity" : "normal";

    result.push({ districtId, districtName: getDistrictName(districtId), opdCapacity: capacity, todaysLoad: load, utilizationPercent: utilPct, status });
  }

  return result;
}

export async function listAnnouncements(): Promise<StateAnnouncement[]> {
  await dbConnect();
  const docs = await NotificationModel.find({ type: "announcement" }).sort({ createdAt: -1 }).limit(20).lean();
  return docs.map((d) => ({
    id: String(d._id),
    title: String(d.title ?? ""),
    message: String(d.message ?? ""),
    status: (d.status as StateAnnouncement["status"]) ?? "published",
    targetType: (d.targetType as StateAnnouncement["targetType"]) ?? "all",
    targetIds: Array.isArray(d.targetIds) ? d.targetIds : [],
    publishedAt: d.publishedAt ? String(d.publishedAt) : null,
    scheduledAt: d.scheduledAt ? String(d.scheduledAt) : null,
    expiresAt: d.expiresAt ? String(d.expiresAt) : null,
    publishedBy: String(d.createdBy ?? "State Admin"),
    createdAt: String(d.createdAt ?? ""),
  }));
}

export async function publishAnnouncement(
  input: Omit<StateAnnouncement, "id" | "status" | "createdAt" | "publishedBy">,
  actor: { id: string; name: string; role: string }
): Promise<StateAnnouncement> {
  await dbConnect();
  const doc = await NotificationModel.create({
    type: "announcement",
    title: input.title,
    message: input.message,
    targetType: input.targetType,
    targetIds: input.targetIds,
    status: "published",
    publishedAt: new Date().toISOString(),
    publishedBy: actor.name,
    createdAt: new Date().toISOString(),
    createdBy: actor.name,
  });
  return {
    id: String(doc._id),
    title: input.title,
    message: input.message,
    status: "published",
    targetType: input.targetType,
    targetIds: input.targetIds,
    publishedAt: new Date().toISOString(),
    scheduledAt: null,
    expiresAt: null,
    publishedBy: actor.name,
    createdAt: new Date().toISOString(),
  };
}

export async function getAuditLog(): Promise<StateAuditEvent[]> {
  await dbConnect();
  const docs = await AuditLogModel.find({}).sort({ createdAt: -1 }).limit(50).lean();
  return docs.map((d) => ({
    id: String(d._id),
    at: String(d.createdAt ?? ""),
    actorId: String(d.actorId ?? ""),
    actorName: String(d.actorName ?? "System"),
    actorRole: String(d.actorRole ?? "system"),
    action: String(d.action ?? "") as StateAuditEvent["action"],
    targetType: String(d.resourceType ?? ""),
    targetId: String(d.resourceId ?? ""),
    summary: typeof d.detail === "object" ? JSON.stringify(d.detail) : String(d.detail ?? ""),
    result: "success" as const,
  }));
}

export async function getAlertsSummary(): Promise<StateAlertSummary> {
  await dbConnect();
  const docs = await GovernmentAlertModel.find({}).sort({ createdAt: -1 }).limit(50).lean();
  const items = docs.map((d) => plain(d)) as any[];
  return {
    critical: items.filter((i: any) => i.severity === "critical").length,
    warning: items.filter((i: any) => i.severity === "warning").length,
    notice: items.filter((i: any) => i.severity === "info").length,
    items: items as StateAlertSummary["items"],
  };
}

export async function getUsers(): Promise<Array<{ id: string; name: string; role: string; district?: string; status: string }>> {
  await dbConnect();
  const docs = await (await import("@/lib/models")).UserModel.find({}).limit(100).lean();
  return docs.map((d) => ({
    id: String(d._id),
    name: String(d.name ?? ""),
    role: String(d.role ?? ""),
    district: d.scope?.districtId ? String(d.scope.districtId) : undefined,
    status: String(d.status ?? "active"),
  }));
}

export async function toggleHospitalActive(hospitalId: string): Promise<void> {
  await dbConnect();
  const doc = await HospitalModel.findById(hospitalId).lean();
  if (!doc) throw new Error("Hospital not found");
  const newStatus = doc.status === "active" ? "inactive" : "active";
  await HospitalModel.updateOne({ _id: hospitalId }, { $set: { status: newStatus } });
}

export async function getSystemHealth() {
  await dbConnect();
  const lastCheckedAt = new Date().toISOString();
  const hospitalCount = await HospitalModel.countDocuments();
  const doctorCount = await DoctorModel.countDocuments();
  return {
    lastCheckedAt,
    services: [
      { id: "svc_db", service: "MongoDB", status: "healthy" as const, lastCheckedAt },
      { id: "svc_hospitals", service: "Hospital Registry", status: hospitalCount > 0 ? ("healthy" as const) : ("degraded" as const), lastCheckedAt, detail: `${hospitalCount} hospitals registered` },
      { id: "svc_doctors", service: "Doctor Registry", status: doctorCount > 0 ? ("healthy" as const) : ("degraded" as const), lastCheckedAt, detail: `${doctorCount} doctors registered` },
      { id: "svc_queue", service: "OPD Queue Engine", status: "healthy" as const, lastCheckedAt },
      { id: "svc_notifications", service: "Notification Gateway", status: "healthy" as const, lastCheckedAt },
    ],
  };
}

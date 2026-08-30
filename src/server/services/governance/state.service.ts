
import "server-only";
import { dbConnect } from "@/lib/db";
import {
  UserModel,
  DoctorModel,
  HospitalModel,
  HospitalServiceModel,
  CurrentHospitalCapacityModel,
  GovernmentAlertModel,
  AnnouncementModel,
  plain,
  plainList,
} from "@/lib/models";
import { analyticsRepository, alertRepository, capacityRepository, auditRepository } from "@/server/repositories/governance.repository";
import { hospitalRepository, districtRepository } from "@/server/repositories/hospital.repository";
import type { AccessContext } from "@/server/lib/access-context";
import { assertAnyDistrictAccess } from "@/server/lib/scope-access";
import { getDistrictName, DISTRICTS } from "@/config/districts";
import type { StateAnnouncement, StateCapacityRow, StateServiceAvailabilityRow, StateUserRow, SystemHealthData } from "@/services/state/types";

export class StateService {
  async getStats(ctx: AccessContext): Promise<StateStats> {
    assertAnyDistrictAccess(ctx);

    const [metrics, alerts] = await Promise.all([
      analyticsRepository.getLatestStateMetrics(ctx),
      alertRepository.getStatewideAlerts(ctx),
    ]);

    return {
      stateName: "Kerala",
      districts: DISTRICTS.length,
      hospitals: metrics?.activeHospitals || 0,
      patientsToday: metrics?.totalVisits || 0,
      opdConsultations: metrics?.totalVisits || 0,
      appointments: metrics?.appointments || 0,
      waiting: 0,
      activeOpds: 0,
      avgWaitMinutes: metrics?.avgWaitMinutes || 0,
      statuses: { normal: 0, highLoad: 0, alert: 0 },
    };
  }

  async getAnalytics(period: "today" | "weekly" | "monthly", ctx: AccessContext) {
    assertAnyDistrictAccess(ctx);

    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = this.getPeriodStartDate(period);

    const metrics = await analyticsRepository.getStateMetricsRange(startDate, endDate, ctx);

    const totalVisits = metrics.reduce((s, m) => s + m.totalVisits, 0);
    const appointments = metrics.reduce((s, m) => s + m.appointments, 0);
    const avgWaitMinutes = metrics.length ? Math.round(metrics.reduce((s, m) => s + m.avgWaitMinutes, 0) / metrics.length) : 0;

    return {
      patientsToday: totalVisits,
      appointments,
      activeOpds: metrics.length > 0 ? metrics[0].activeHospitals || 0 : 0,
      avgWaitMinutes,
      totalVisits,
      walkIns: metrics.reduce((s, m) => s + m.walkIns, 0),
      completedConsultations: totalVisits,
      noShows: 0,
      hospitalUtilization: 0,
    };
  }

  async getDistrictComparison(ctx: AccessContext) {
    assertAnyDistrictAccess(ctx);
    const rows = [];

    for (const d of DISTRICTS) {
      const metrics = await analyticsRepository.getLatestDistrictMetrics(d.id, ctx);
      const hospitals = await hospitalRepository.findByDistrict(d.id, ctx);

      let waiting = 0;
      let completed = 0;
      let patients = 0;

      if (metrics) {
        patients = metrics.totalVisits;
        completed = metrics.completedVisits;
        waiting = metrics.totalWaiting || 0;
      }

      rows.push({
        districtId: d.id,
        districtName: d.name,
        hospitals: hospitals.length,
        patients,
        waiting,
        avgWaitMinutes: metrics?.avgWaitMinutes || 0,
        completed,
        status: this.queueHealth(waiting, patients),
      });
    }

    return rows;
  }

  async listHospitalDirectory(filters: { districtId?: string; query?: string }, ctx: AccessContext) {
    assertAnyDistrictAccess(ctx);

    const query: Record<string, unknown> = {};
    if (filters.districtId) query.districtId = filters.districtId;

    const hospitals = await hospitalRepository.findAll(ctx, query);

    return hospitals.map((h) => ({
      hospitalId: h.id,
      name: h.name,
      districtId: h.districtId,
      districtName: getDistrictName(h.districtId),
      type: h.type || "government_hospital",
      status: h.status || "active",
      patients: 0,
      waiting: 0,
      completed: 0,
      avgWaitMinutes: 0,
      servicesCount: h.capacity?.opds || 0,
      load: "normal" as "normal" | "high_load" | "alert",
    }));
  }

  async toggleHospitalActive(hospitalId: string, ctx: AccessContext) {
    assertAnyDistrictAccess(ctx);
    await hospitalRepository.updateStatus(hospitalId, "active", ctx);
  }

  async getAlertsSummary(ctx: AccessContext) {
    assertAnyDistrictAccess(ctx);
    const alerts = await alertRepository.getStatewideAlerts(ctx);

    return {
      critical: alerts.filter(a => a.severity === "critical").length,
      warning: alerts.filter(a => a.severity === "warning").length,
      notice: alerts.filter(a => a.severity === "info").length,
      items: alerts,
    };
  }

  async getAuditLog(ctx: AccessContext) {
    assertAnyDistrictAccess(ctx);
    const logs = await auditRepository.findStatewide(ctx, {}, 50);
    return logs.map((l) => ({
      id: l.id,
      at: typeof l.timestamp === 'string' ? l.timestamp : String(l.timestamp),
      actorId: l.actorId,
      actorName: l.actorName,
      actorRole: l.actorRole,
      action: l.action,
      targetType: l.resourceType,
      targetId: l.resourceId,
      summary: l.detail ? JSON.stringify(l.detail) : l.action,
      result: l.result || "success",
    }));
  }

  async listAnnouncements(ctx: AccessContext): Promise<StateAnnouncement[]> {
    assertAnyDistrictAccess(ctx);
    await dbConnect();

    const docs = await AnnouncementModel.find({ targetType: "all" })
      .sort({ createdAt: -1 })
      .lean();

    return docs.map((d) => ({
      id: String(d._id),
      title: d.title,
      message: d.message,
      status: (d.status as StateAnnouncement["status"]) || "draft",
      targetType: (d.targetType as StateAnnouncement["targetType"]) || "all",
      targetIds: d.targetIds || [],
      publishedAt: d.publishedAt,
      scheduledAt: d.scheduledAt,
      expiresAt: d.expiresAt,
      publishedBy: d.publishedBy || "",
      createdAt: d.createdAt,
    }));
  }

  async publishAnnouncement(input: any, ctx: AccessContext) {
    assertAnyDistrictAccess(ctx);
    await dbConnect();

    const now = new Date().toISOString();
    const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const doc = await AnnouncementModel.create({
      _id: id,
      title: input.title || "",
      message: input.message || "",
      targetType: "all",
      targetIds: input.targetIds || [],
      audience: input.audience || "hospitals",
      publishedAt: now,
      scheduledAt: input.scheduledAt || null,
      expiresAt: input.expiresAt || null,
      publishedBy: ctx.userId,
      status: "published",
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: doc._id,
      title: doc.title,
      message: doc.message,
      status: "published" as const,
      targetType: "all" as const,
      targetIds: doc.targetIds,
      publishedAt: doc.publishedAt,
      scheduledAt: doc.scheduledAt,
      expiresAt: doc.expiresAt,
      publishedBy: doc.publishedBy,
      createdAt: doc.createdAt,
    };
  }

  async getUsers(ctx: AccessContext): Promise<StateUserRow[]> {
    assertAnyDistrictAccess(ctx);
    await dbConnect();

    const roles = ["state_admin", "district_admin", "hospital_admin"] as const;
    const users = await UserModel.find({ role: { $in: roles } }).lean();

    return users.map((u) => ({
      id: u._id,
      name: u.name,
      role: u.role,
      districtId: u.scope?.districtId as StateUserRow["districtId"],
      hospitalId: u.scope?.hospitalId,
      status: (u.status as "active" | "inactive") || "active",
      lastLogin: null,
    }));
  }

  async getServiceAvailability(ctx: AccessContext): Promise<StateServiceAvailabilityRow[]> {
    assertAnyDistrictAccess(ctx);
    await dbConnect();

    const services = await HospitalServiceModel.find({ status: "active" }).lean();
    if (services.length === 0) return [];

    const allHospitalIds = [...new Set(services.map((s) => s.hospitalId))];
    const hospitals = await HospitalModel.find({ _id: { $in: allHospitalIds } }).lean();
    const hospitalToDistrict = new Map(hospitals.map((h) => [String(h._id), h.districtId]));

    const serviceMap = new Map<string, { serviceName: string; code: string; hospitalIds: Set<string>; districtIds: Set<string> }>();
    for (const svc of services) {
      if (!serviceMap.has(svc.code)) {
        serviceMap.set(svc.code, { serviceName: svc.name, code: svc.code, hospitalIds: new Set(), districtIds: new Set() });
      }
      const entry = serviceMap.get(svc.code)!;
      entry.hospitalIds.add(svc.hospitalId);
      const did = hospitalToDistrict.get(svc.hospitalId);
      if (did) entry.districtIds.add(did);
    }

    return Array.from(serviceMap.values()).map((v) => ({
      serviceName: v.serviceName,
      code: v.code,
      hospitalCount: v.hospitalIds.size,
      districtCount: v.districtIds.size,
    }));
  }

  async getCapacityByDistrict(ctx: AccessContext): Promise<StateCapacityRow[]> {
    assertAnyDistrictAccess(ctx);
    await dbConnect();

    const capacities = await CurrentHospitalCapacityModel.find().lean();
    if (capacities.length === 0) return [];

    const allHospitalIds = [...new Set(capacities.map((c) => c.hospitalId))];
    const hospitals = await HospitalModel.find({ _id: { $in: allHospitalIds } }).lean();
    const hospitalToDistrict = new Map(hospitals.map((h) => [String(h._id), { districtId: h.districtId, districtName: getDistrictName(h.districtId) }]));

    const districtMap = new Map<string, { districtId: string; districtName: string; opdCapacity: number; todaysLoad: number }>();

    for (const cap of capacities) {
      const info = hospitalToDistrict.get(cap.hospitalId);
      if (!info) continue;

      if (!districtMap.has(info.districtId)) {
        districtMap.set(info.districtId, { districtId: info.districtId, districtName: info.districtName, opdCapacity: 0, todaysLoad: 0 });
      }
      const entry = districtMap.get(info.districtId)!;
      entry.opdCapacity += cap.availableSlots + cap.occupiedSlots;
      entry.todaysLoad += cap.occupiedSlots;
    }

    return Array.from(districtMap.values()).map((v) => {
      const utilizationPercent = v.opdCapacity > 0 ? Math.round((v.todaysLoad / v.opdCapacity) * 100) : 0;
      const status: "normal" | "near_capacity" | "exceeded" =
        utilizationPercent > 100 ? "exceeded" : utilizationPercent >= 85 ? "near_capacity" : "normal";
      return {
        districtId: v.districtId as StateCapacityRow["districtId"],
        districtName: v.districtName,
        opdCapacity: v.opdCapacity,
        todaysLoad: v.todaysLoad,
        utilizationPercent,
        status,
      };
    });
  }

  async getSystemHealth(ctx: AccessContext): Promise<SystemHealthData> {
    assertAnyDistrictAccess(ctx);

    const now = new Date().toISOString();
    const services: SystemHealthData["services"] = [];
    let overall: SystemHealthData["overall"] = "healthy";

    try {
      await dbConnect();
      services.push({ id: "db", service: "Database", status: "healthy", lastCheckedAt: now });
    } catch {
      services.push({ id: "db", service: "Database", status: "down", lastCheckedAt: now, detail: "Connection failed" });
      overall = "down";
    }

    try {
      await dbConnect();
      const hospitalCount = await HospitalModel.countDocuments({ status: "active" });
      services.push({
        id: "hospitals",
        service: "Hospitals",
        status: hospitalCount > 0 ? "healthy" : "degraded",
        lastCheckedAt: now,
        detail: `${hospitalCount} active`,
      });
    } catch {
      services.push({ id: "hospitals", service: "Hospitals", status: "down", lastCheckedAt: now });
      if (overall !== "down") overall = "degraded";
    }

    try {
      await dbConnect();
      const doctorCount = await DoctorModel.countDocuments({ status: "active" });
      services.push({
        id: "doctors",
        service: "Doctors",
        status: doctorCount > 0 ? "healthy" : "degraded",
        lastCheckedAt: now,
        detail: `${doctorCount} active`,
      });
    } catch {
      services.push({ id: "doctors", service: "Doctors", status: "down", lastCheckedAt: now });
      if (overall !== "down") overall = "degraded";
    }

    await dbConnect();
    const alerts = await GovernmentAlertModel.find({
      status: { $in: ["open", "active", "acknowledged"] },
      severity: { $in: ["critical", "warning"] },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      overall,
      services,
      incidents: alerts.map((a) => ({
        id: String(a._id),
        title: a.message || a.type,
        severity: a.severity as "critical" | "warning",
        status: a.status === "resolved" ? "resolved" as const : "active" as const,
        createdAt: typeof a.createdAt === "string" ? a.createdAt : String(a.createdAt),
      })),
    };
  }

  private queueHealth(waiting: number, total: number): "healthy" | "warning" | "critical" {
    const ratio = total > 0 ? waiting / total : 0;
    if (ratio > 0.5 || waiting > 50) return "critical";
    if (ratio > 0.2 || waiting > 20) return "warning";
    return "healthy";
  }

  private getPeriodStartDate(period: string): string {
    const now = new Date();
    if (period === "today") return now.toISOString().slice(0, 10);
    const days = period === "weekly" ? 7 : 30;
    const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    return start.toISOString().slice(0, 10);
  }
}

import type { StateStats } from "@/services/state/types";

export const stateService = new StateService();

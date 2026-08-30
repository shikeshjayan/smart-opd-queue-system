
import "server-only";
import { dbConnect } from "@/lib/db";
import {
  StaffModel,
  DoctorModel,
  DepartmentModel,
  HospitalServiceModel,
  AnnouncementModel,
  plain,
  plainList,
} from "@/lib/models";
import { analyticsRepository, alertRepository, capacityRepository, auditRepository } from "@/server/repositories/governance.repository";
import { hospitalRepository } from "@/server/repositories/hospital.repository";
import type { AccessContext } from "@/server/lib/access-context";
import { assertDistrictAccess, assertAnyDistrictAccess } from "@/server/lib/scope-access";
import type { District, Hospital, GovernmentAlert, DailyDistrictMetrics, DailyStateMetrics, CurrentHospitalCapacity } from "@/types";
import type { Announcement, DistrictSettings } from "@/services/district/types";
import { getDistrictName } from "@/config/districts";

export class DistrictService {
  async getDashboard(districtId: string, ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);

    const [hospitals, metrics, alerts] = await Promise.all([
      hospitalRepository.findByDistrict(districtId, ctx),
      analyticsRepository.getLatestDistrictMetrics(districtId, ctx),
      alertRepository.findActiveByDistrict(districtId, ctx),
    ]);

    const hospitalRows = hospitals.map((h) => ({
      hospitalId: h.id,
      name: h.name,
      address: h.address,
      phone: h.phone,
      patients: metrics?.totalVisits || 0,
      waiting: metrics?.totalWaiting || 0,
      completed: metrics?.completedVisits || 0,
      avgWaitMinutes: metrics?.avgWaitMinutes || 0,
      activeOpds: h.capacity?.opds || 0,
      departments: 0,
      doctors: 0,
      status: this.calculateLoadStatus(metrics?.totalWaiting || 0),
    }));

    const totalPatients = hospitalRows.reduce((s, r) => s + r.patients, 0);
    const totalWaiting = hospitalRows.reduce((s, r) => s + r.waiting, 0);
    const statuses = { normal: 0, highLoad: 0, alert: 0 };
    
    for (const r of hospitalRows) {
      if (r.status === "alert") statuses.alert++;
      else if (r.status === "high_load") statuses.highLoad++;
      else statuses.normal++;
    }

    const longestQueue = hospitalRows.reduce(
      (best, r) => (!best || r.waiting > best.waiting ? r : best),
      null as typeof hospitalRows[0] | null
    );

    return {
      districtId,
      districtName: getDistrictName(districtId),
      performance: {
        totalPatients,
        totalWaiting,
        avgWaitMinutes: hospitalRows.length ? Math.round(hospitalRows.reduce((s, r) => s + r.avgWaitMinutes, 0) / hospitalRows.length) : 0,
      },
      hospitals: hospitalRows,
      alerts: alerts.map((a) => ({
        id: a.id,
        title: `${a.severity.toUpperCase()}: ${a.type}`,
        message: a.message,
        severity: a.severity,
        hospitalId: a.hospitalId,
      })),
      longestQueue,
      announcements: [],
    };
  }

  private calculateLoadStatus(waiting: number): "normal" | "high_load" | "alert" {
    if (waiting > 40) return "alert";
    if (waiting > 20) return "high_load";
    return "normal";
  }

  async getAnalytics(districtId: string, period: "today" | "weekly" | "monthly", ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);

    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = this.getPeriodStartDate(period);
    
    const metrics = await analyticsRepository.getDistrictMetricsRange(districtId, startDate, endDate, ctx);

    const departmentMap = new Map<string, { departmentName: string; visits: number }>();
    
    for (const m of metrics) {
      for (const dept of m.departmentBreakdown) {
        const key = dept.departmentId;
        if (!departmentMap.has(key)) {
          departmentMap.set(key, { departmentName: dept.departmentName, visits: 0 });
        }
        departmentMap.get(key)!.visits += dept.visits;
      }
    }

    const departmentVolume = Array.from(departmentMap.entries()).map(([departmentId, data]) => ({
      departmentName: data.departmentName,
      departmentId,
      visits: data.visits,
    }));

    const totalVisits = departmentVolume.reduce((s, d) => s + d.visits, 0);

    return {
      period,
      periodLabel: period === "today" ? "Today" : period === "weekly" ? "This Week" : "This Month",
      totalVisits,
      appointments: Math.round(totalVisits * 0.3),
      walkIns: Math.round(totalVisits * 0.7),
      completedConsultations: totalVisits,
      noShows: 0,
      avgWaitMinutes: metrics.length ? Math.round(metrics.reduce((s, m) => s + m.avgWaitMinutes, 0) / metrics.length) : 0,
      avgConsultationMinutes: 15,
      departmentVolume,
    };
  }

  async listHospitalRows(districtId: string, ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);
    const hospitals = await hospitalRepository.findByDistrict(districtId, ctx);
    
    const rows = [];
    for (const h of hospitals) {
      const metrics = await analyticsRepository.getLatestHospitalMetrics(h.id, ctx);
      rows.push({
        hospitalId: h.id,
        name: h.name,
        address: h.address,
        phone: h.phone,
        patients: metrics?.totalVisits || 0,
        waiting: metrics?.totalWaiting || 0,
        completed: metrics?.completedVisits || 0,
        avgWaitMinutes: metrics?.avgWaitMinutes || 0,
        activeOpds: h.capacity?.opds || 0,
        departments: 0,
        doctors: 0,
        status: this.calculateLoadStatus(metrics?.totalWaiting || 0),
      });
    }
    
    return rows;
  }

  async getComparison(districtId: string, ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);
    const rows = await this.listHospitalRows(districtId, ctx);
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

  async getCapacity(districtId: string, ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);
    const capacities = await capacityRepository.getAllDistrictCapacity(districtId, ctx);
    
    return capacities.map((c) => {
      const totalBeds = c.availableSlots + c.occupiedSlots;
      const utilizationPercent = totalBeds > 0 ? Math.round((c.occupiedSlots / totalBeds) * 100) : 0;
      const status: "normal" | "near_capacity" | "exceeded" = 
        utilizationPercent > 100 ? "exceeded" : utilizationPercent >= 85 ? "near_capacity" : "normal";
      
      return {
        hospitalId: c.hospitalId,
        hospitalName: "", // Would need hospital lookup
        departmentId: c.departmentId,
        departmentName: "", // Would need department lookup
        expectedCapacity: totalBeds,
        appointments: c.occupiedSlots,
        walkIns: 0,
        total: c.occupiedSlots,
        utilizationPercent,
        status,
      };
    });
  }

  async getResources(districtId: string, ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);
    await dbConnect();
    const hospitals = await hospitalRepository.findByDistrict(districtId, ctx);

    const hospitalIds = hospitals.map((h) => h.id);
    const [staffDocs, doctorDocs] = await Promise.all([
      StaffModel.find({ hospitalId: { $in: hospitalIds } }).lean(),
      DoctorModel.find({ hospitalId: { $in: hospitalIds } }).lean(),
    ]);

    const staffByHospital = new Map<string, typeof staffDocs>();
    for (const s of staffDocs) {
      const list = staffByHospital.get(s.hospitalId) || [];
      list.push(s);
      staffByHospital.set(s.hospitalId, list);
    }

    const doctorsByHospital = new Map<string, typeof doctorDocs>();
    for (const d of doctorDocs) {
      const list = doctorsByHospital.get(d.hospitalId) || [];
      list.push(d);
      doctorsByHospital.set(d.hospitalId, list);
    }

    return hospitals.map((h) => {
      const staff = staffByHospital.get(h.id) || [];
      const doctors = doctorsByHospital.get(h.id) || [];
      const activeDoctors = doctors.filter((d) => d.status === "active");
      return {
        hospitalId: h.id,
        hospitalName: h.name,
        doctorsTotal: doctors.length,
        doctorsAvailable: activeDoctors.length,
        nurses: staff.filter((s) => s.role === "nurse").length,
        labStaff: staff.filter((s) => s.role === "lab_technician").length,
        pharmacyStaff: staff.filter((s) => s.role === "pharmacist").length,
        otherStaff: staff.filter((s) => !["nurse", "lab_technician", "pharmacist"].includes(s.role || "")).length,
        servicesActive: h.capacity?.opds || 0,
      };
    });
  }

  async getDoctorAvailability(hospitalId: string, ctx: AccessContext) {
    const { hospitalRepository: hospRepo } = await import("@/server/repositories/hospital.repository");
    await hospRepo.findById(hospitalId, ctx);
    await dbConnect();

    const [doctors, departments] = await Promise.all([
      DoctorModel.find({ hospitalId }).lean(),
      DepartmentModel.find({ hospitalId }).lean(),
    ]);

    const deptMap = new Map<string, {
      departmentId: string;
      departmentName: string;
      available: number;
      onLeave: number;
      unavailable: number;
      doctorNames: string[];
    }>();

    for (const dept of departments) {
      const deptId = String(dept._id);
      deptMap.set(deptId, {
        departmentId: deptId,
        departmentName: dept.name,
        available: 0,
        onLeave: 0,
        unavailable: 0,
        doctorNames: [],
      });
    }

    for (const doc of doctors) {
      const deptId = String(doc.departmentId);
      const entry = deptMap.get(deptId);
      if (entry) {
        if (doc.status === "active") entry.available++;
        else entry.unavailable++;
        entry.doctorNames.push(doc.name);
      } else {
        deptMap.set(deptId, {
          departmentId: deptId,
          departmentName: "",
          available: doc.status === "active" ? 1 : 0,
          onLeave: 0,
          unavailable: doc.status !== "active" ? 1 : 0,
          doctorNames: [doc.name],
        });
      }
    }

    return Array.from(deptMap.values());
  }

  async getServiceMatrix(districtId: string, ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);
    await dbConnect();
    const hospitals = await hospitalRepository.findByDistrict(districtId, ctx);
    const hospitalIds = hospitals.map((h) => h.id);

    const services = await HospitalServiceModel.find({ hospitalId: { $in: hospitalIds }, status: "active" }).lean();

    const serviceMap = new Map<string, { serviceName: string; code: string; providerHospitalIds: Set<string> }>();
    for (const svc of services) {
      const key = svc.code;
      if (!serviceMap.has(key)) {
        serviceMap.set(key, { serviceName: svc.name, code: svc.code, providerHospitalIds: new Set() });
      }
      serviceMap.get(key)!.providerHospitalIds.add(svc.hospitalId);
    }

    return Array.from(serviceMap.values()).map((v) => ({
      serviceName: v.serviceName,
      code: v.code,
      providerHospitalIds: Array.from(v.providerHospitalIds),
    }));
  }

  async getReferrals(districtId: string, ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);
    // ReferralModel not yet implemented
    return [];
  }

  async listAnnouncements(districtId: string, ctx: AccessContext): Promise<Announcement[]> {
    assertDistrictAccess(ctx, districtId);
    await dbConnect();

    const docs = await AnnouncementModel.find({
      $or: [
        { districtId, status: "published" },
        { targetType: "all", status: "published" },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return docs.map((d) => ({
      id: String(d._id),
      title: d.title,
      message: d.message,
      audience: d.audience || "hospitals",
      targetIds: d.targetIds || [],
      publishedAt: d.publishedAt || "",
      publishedBy: d.publishedBy || "",
      status: d.status === "published" ? "published" : "draft",
    }));
  }

  async publishAnnouncement(districtId: string, input: any, ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);
    await dbConnect();

    const now = new Date().toISOString();
    const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const doc = await AnnouncementModel.create({
      _id: id,
      title: input.title || "",
      message: input.message || "",
      targetType: "districts",
      targetIds: input.targetIds || [],
      districtId,
      hospitalId: input.hospitalId || null,
      audience: input.audience || "hospitals",
      publishedAt: now,
      publishedBy: ctx.userId,
      status: "published",
      createdAt: now,
      updatedAt: now,
    } as any);

    return {
      id: String(doc._id),
      title: doc.title,
      message: doc.message,
      audience: doc.audience,
      targetIds: doc.targetIds,
      publishedAt: doc.publishedAt,
      publishedBy: doc.publishedBy,
      status: doc.status as "published",
    };
  }

  async listAudit(districtId: string, ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);
    const logs = await auditRepository.findByDistrict(districtId, ctx, {}, 50);
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
    }));
  }

  async getSettings(districtId: string, ctx: AccessContext): Promise<DistrictSettings> {
    assertDistrictAccess(ctx, districtId);
    const { districtConfigRepository } = await import("@/server/repositories/hospital.repository");
    return districtConfigRepository.getEffectiveSettings(districtId, ctx) as unknown as Promise<DistrictSettings>;
  }

  async saveSettings(districtId: string, settings: any, ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);
    const { districtConfigRepository } = await import("@/server/repositories/hospital.repository");
    return districtConfigRepository.update(districtId, settings, ctx);
  }

  async getReport(districtId: string, type: string, ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);
    return { type, title: `Report: ${type}`, data: [] };
  }

  async toggleHospitalActive(hospitalId: string, ctx: AccessContext) {
    await hospitalRepository.updateStatus(hospitalId, "active", ctx);
  }

  private getPeriodStartDate(period: string): string {
    const now = new Date();
    if (period === "today") return now.toISOString().slice(0, 10);
    const days = period === "weekly" ? 7 : 30;
    const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    return start.toISOString().slice(0, 10);
  }
}

export const districtService = new DistrictService();
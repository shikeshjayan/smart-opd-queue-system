"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  DailyDistrictMetricsModel,
  DailyStateMetricsModel,
  DailyHospitalMetricsModel,
  CurrentHospitalCapacityModel,
  GovernmentAlertModel,
  AuditLogModel,
  plain,
  plainList,
} from "@/lib/models";
import type { AccessContext } from "@/server/lib/access-context";
import { assertDistrictAccess, assertAnyDistrictAccess } from "@/server/lib/scope-access";
import type {
  DailyDistrictMetrics,
  DailyStateMetrics,
  DailyHospitalMetrics,
  CurrentHospitalCapacity,
  GovernmentAlert,
  AuditLog,
} from "@/types";

export class AnalyticsRepository {
  async getDistrictMetrics(districtId: string, date: string, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    const doc = await DailyDistrictMetricsModel.findOne({ districtId, date }).lean();
    return plain<DailyDistrictMetrics>(doc);
  }

  async getDistrictMetricsRange(districtId: string, startDate: string, endDate: string, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    const docs = await DailyDistrictMetricsModel.find({
      districtId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 }).lean();
    return plainList<DailyDistrictMetrics>(docs);
  }

  async getStateMetrics(date: string, ctx: AccessContext) {
    await dbConnect();
    assertAnyDistrictAccess(ctx);
    const doc = await DailyStateMetricsModel.findOne({ stateId: "KERALA", date }).lean();
    return plain<DailyStateMetrics>(doc);
  }

  async getStateMetricsRange(startDate: string, endDate: string, ctx: AccessContext) {
    await dbConnect();
    assertAnyDistrictAccess(ctx);
    const docs = await DailyStateMetricsModel.find({
      stateId: "KERALA",
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 }).lean();
    return plainList<DailyStateMetrics>(docs);
  }

  async getHospitalMetrics(hospitalId: string, date: string, ctx: AccessContext) {
    await dbConnect();
    const { hospitalRepository } = await import("@/server/repositories/hospital.repository");
    await hospitalRepository.findById(hospitalId, ctx);
    
    const doc = await DailyHospitalMetricsModel.findOne({ hospitalId, date }).lean();
    return plain<DailyHospitalMetrics>(doc);
  }

  async getLatestDistrictMetrics(districtId: string, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    const doc = await DailyDistrictMetricsModel.findOne({ districtId }).sort({ date: -1 }).lean();
    return plain<DailyDistrictMetrics>(doc);
  }

  async getLatestStateMetrics(ctx: AccessContext) {
    await dbConnect();
    assertAnyDistrictAccess(ctx);
    const doc = await DailyStateMetricsModel.findOne({ stateId: "KERALA" }).sort({ date: -1 }).lean();
    return plain<DailyStateMetrics>(doc);
  }

  async getLatestHospitalMetrics(hospitalId: string, ctx: AccessContext) {
    await dbConnect();
    const { hospitalRepository } = await import("@/server/repositories/hospital.repository");
    await hospitalRepository.findById(hospitalId, ctx);
    
    const doc = await DailyHospitalMetricsModel.findOne({ hospitalId }).sort({ date: -1 }).lean();
    return plain<DailyHospitalMetrics>(doc);
  }

  async upsertDistrictMetrics(
    districtId: string,
    data: Omit<DailyDistrictMetrics, "id" | "createdAt">,
    ctx: AccessContext
  ) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    const doc = await DailyDistrictMetricsModel.findOneAndUpdate(
      { districtId, date: data.date },
      { $set: { ...data, districtId, updatedAt: new Date() } },
      { upsert: true, new: true }
    ).lean();
    return plain<DailyDistrictMetrics>(doc);
  }

  async upsertStateMetrics(
    data: Omit<DailyStateMetrics, "id" | "createdAt">,
    ctx: AccessContext
  ) {
    await dbConnect();
    assertAnyDistrictAccess(ctx);
    const doc = await DailyStateMetricsModel.findOneAndUpdate(
      { stateId: "KERALA", date: data.date },
      { $set: { ...data, stateId: "KERALA", updatedAt: new Date() } },
      { upsert: true, new: true }
    ).lean();
    return plain<DailyStateMetrics>(doc);
  }
}

export class CapacityRepository {
  async getHospitalCapacity(hospitalId: string, ctx: AccessContext) {
    await dbConnect();
    const { hospitalRepository } = await import("@/server/repositories/hospital.repository");
    await hospitalRepository.findById(hospitalId, ctx);
    
    const docs = await CurrentHospitalCapacityModel.find({ hospitalId }).lean();
    return plainList<CurrentHospitalCapacity>(docs);
  }

  async getDepartmentCapacity(hospitalId: string, departmentId: string, ctx: AccessContext) {
    await dbConnect();
    const { hospitalRepository } = await import("@/server/repositories/hospital.repository");
    await hospitalRepository.findById(hospitalId, ctx);
    
    const doc = await CurrentHospitalCapacityModel.findOne({ hospitalId, departmentId }).lean();
    return plain<CurrentHospitalCapacity>(doc);
  }

  async getAllDistrictCapacity(districtId: string, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    
    const { hospitalRepository } = await import("@/server/repositories/hospital.repository");
    const hospitals = await hospitalRepository.findByDistrict(districtId, ctx);
    const hospitalIds = hospitals.map(h => h.id);
    
    const docs = await CurrentHospitalCapacityModel.find({ hospitalId: { $in: hospitalIds } }).lean();
    return plainList<CurrentHospitalCapacity>(docs);
  }

  async updateCapacity(
    hospitalId: string,
    departmentId: string,
    updates: Partial<CurrentHospitalCapacity>,
    ctx: AccessContext
  ) {
    await dbConnect();
    const { hospitalRepository } = await import("@/server/repositories/hospital.repository");
    await hospitalRepository.findById(hospitalId, ctx);
    
    const doc = await CurrentHospitalCapacityModel.findOneAndUpdate(
      { hospitalId, departmentId },
      { $set: { ...updates, lastUpdated: new Date() } },
      { upsert: true, new: true }
    ).lean();
    
    return plain<CurrentHospitalCapacity>(doc);
  }
}

export class AlertRepository {
  async findById(alertId: string, ctx: AccessContext) {
    await dbConnect();
    const doc = await GovernmentAlertModel.findById(alertId).lean();
    if (!doc) return null;
    const alert = plain<GovernmentAlert>(doc);
    assertDistrictAccess(ctx, alert.districtId);
    return alert;
  }

  async findByDistrict(districtId: string, ctx: AccessContext, filter: Record<string, unknown> = {}) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    const docs = await GovernmentAlertModel.find({ districtId, ...filter } as any).sort({ createdAt: -1 }).lean();
    return plainList<GovernmentAlert>(docs);
  }

  async findActiveByDistrict(districtId: string, ctx: AccessContext) {
    return this.findByDistrict(districtId, ctx, { 
      status: { $in: ["open", "acknowledged", "investigating"] } 
    });
  }

  async findByHospital(hospitalId: string, ctx: AccessContext) {
    await dbConnect();
    const { hospitalRepository } = await import("@/server/repositories/hospital.repository");
    await hospitalRepository.findById(hospitalId, ctx);
    
    const docs = await GovernmentAlertModel.find({ hospitalId }).sort({ createdAt: -1 }).lean();
    return plainList<GovernmentAlert>(docs);
  }

  async create(alert: Omit<GovernmentAlert, "id" | "createdAt" | "updatedAt">, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, alert.districtId);
    
    const doc = await GovernmentAlertModel.create({
      ...alert,
      _id: `alert_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    
    return plain<GovernmentAlert>(doc);
  }

  async acknowledge(alertId: string, userId: string, ctx: AccessContext) {
    await dbConnect();
    const alert = await this.findById(alertId, ctx);
    if (!alert) throw new Error("Alert not found");
    
    const doc = await GovernmentAlertModel.findByIdAndUpdate(
      alertId,
      { 
        $set: { 
          status: "acknowledged", 
          assignedTo: userId, 
          acknowledgedAt: new Date(),
          updatedAt: new Date() 
        } 
      },
      { new: true }
    ).lean();
    
    return plain<GovernmentAlert>(doc);
  }

  async resolve(alertId: string, ctx: AccessContext) {
    await dbConnect();
    const alert = await this.findById(alertId, ctx);
    if (!alert) throw new Error("Alert not found");
    
    const doc = await GovernmentAlertModel.findByIdAndUpdate(
      alertId,
      { 
        $set: { 
          status: "resolved", 
          resolvedAt: new Date(),
          updatedAt: new Date() 
        } 
      },
      { new: true }
    ).lean();
    
    return plain<GovernmentAlert>(doc);
  }

  async findActiveByType(hospitalId: string, type: string, ctx: AccessContext) {
    await dbConnect();
    const { hospitalRepository } = await import("@/server/repositories/hospital.repository");
    await hospitalRepository.findById(hospitalId, ctx);
    
    const doc = await GovernmentAlertModel.findOne({ 
      hospitalId, 
      type, 
      status: { $in: ["open", "acknowledged", "investigating"] } 
    } as any).lean();
    
    return plain<GovernmentAlert>(doc);
  }

  async findActiveByDistrictType(districtId: string, type: string, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    
    const doc = await GovernmentAlertModel.findOne({ 
      districtId, 
      type, 
      status: { $in: ["open", "acknowledged", "investigating"] } 
    } as any).lean();
    
    return plain<GovernmentAlert>(doc);
  }

  async updateStatus(alertId: string, status: GovernmentAlert["status"], ctx: AccessContext) {
    await dbConnect();
    const alert = await this.findById(alertId, ctx);
    if (!alert) throw new Error("Alert not found");
    
    const updates: Record<string, unknown> = { status, updatedAt: new Date() };
    if (status === "resolved") updates.resolvedAt = new Date();
    
    const doc = await GovernmentAlertModel.findByIdAndUpdate(
      alertId,
      { $set: updates },
      { new: true }
    ).lean();
    
    return plain<GovernmentAlert>(doc);
  }

  async getStatewideAlerts(ctx: AccessContext, severity?: GovernmentAlert["severity"]) {
    await dbConnect();
    assertAnyDistrictAccess(ctx);
    
    const filter: Record<string, unknown> = {};
    if (severity) filter.severity = severity;
    
    const docs = await GovernmentAlertModel.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    return plainList<GovernmentAlert>(docs);
  }
}

export class AuditRepository {
  async log(entry: Omit<AuditLog, "id" | "timestamp">) {
    await dbConnect();
    
    const doc = await AuditLogModel.create({
      ...entry,
      _id: `audit_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
    });
    
    return plain<AuditLog>(doc);
  }

  async findByActor(actorId: string, ctx: AccessContext, limit = 50) {
    await dbConnect();
    const docs = await AuditLogModel.find({ actorId }).sort({ timestamp: -1 }).limit(limit).lean();
    return plainList<AuditLog>(docs);
  }

  async findByResource(resourceType: string, resourceId: string, ctx: AccessContext, limit = 50) {
    await dbConnect();
    const docs = await AuditLogModel.find({ resourceType, resourceId }).sort({ timestamp: -1 }).limit(limit).lean();
    return plainList<AuditLog>(docs);
  }

  async findByDistrict(districtId: string, ctx: AccessContext, filter: Record<string, unknown> = {}, limit = 100) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    const docs = await AuditLogModel.find({ districtId, ...filter }).sort({ timestamp: -1 }).limit(limit).lean();
    return plainList<AuditLog>(docs);
  }

  async findByHospital(hospitalId: string, ctx: AccessContext, filter: Record<string, unknown> = {}, limit = 100) {
    await dbConnect();
    const { hospitalRepository } = await import("@/server/repositories/hospital.repository");
    await hospitalRepository.findById(hospitalId, ctx);
    
    const docs = await AuditLogModel.find({ hospitalId, ...filter }).sort({ timestamp: -1 }).limit(limit).lean();
    return plainList<AuditLog>(docs);
  }

  async findStatewide(ctx: AccessContext, filter: Record<string, unknown> = {}, limit = 100) {
    await dbConnect();
    assertAnyDistrictAccess(ctx);
    const docs = await AuditLogModel.find(filter).sort({ timestamp: -1 }).limit(limit).lean();
    return plainList<AuditLog>(docs);
  }

  async logMedicalAccess(
    ctx: AccessContext,
    patientId: string,
    accessType: "VIEW" | "EXPORT" | "PRINT",
    resourceId: string,
    hospitalId: string
  ) {
    await dbConnect();
    
    const doc = await AuditLogModel.create({
      actorId: ctx.userId,
      actorName: "User", // Should be resolved from context
      actorRole: ctx.role,
      action: `MEDICAL_RECORD_${accessType}`,
      resourceType: "Patient",
      resourceId: patientId,
      hospitalId,
      districtId: ctx.districtIds[0],
      timestamp: new Date(),
      result: "success",
      detail: { accessType },
    });
    
    return plain<AuditLog>(doc);
  }
}

export const analyticsRepository = new AnalyticsRepository();
export const capacityRepository = new CapacityRepository();
export const alertRepository = new AlertRepository();
export const auditRepository = new AuditRepository();
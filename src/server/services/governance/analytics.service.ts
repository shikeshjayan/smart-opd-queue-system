"use server";

import "server-only";
import { analyticsRepository } from "@/server/repositories/governance.repository";
import { hospitalRepository } from "@/server/repositories/hospital.repository";
import type { AccessContext } from "@/server/lib/access-context";
import { assertDistrictAccess, assertHospitalAccess, assertAnyDistrictAccess } from "@/server/lib/scope-access";
import type { DailyHospitalMetrics, DailyDistrictMetrics, DailyStateMetrics, CurrentHospitalCapacity } from "@/types";
import { createOutboxEvent } from "@/server/services/outbox.service";

export class AnalyticsService {
  async recordHospitalVisit(
    hospitalId: string,
    departmentId: string,
    visitType: "appointment" | "walkin",
    waitMinutes: number,
    consultationMinutes: number,
    ctx: AccessContext
  ) {
    assertHospitalAccess(ctx, hospitalId);
    
    const today = new Date().toISOString().slice(0, 10);
    await this.incrementHospitalMetrics(hospitalId, departmentId, visitType, waitMinutes, consultationMinutes, today);
    await createOutboxEvent("HospitalMetrics", hospitalId, "VisitRecorded", {
      hospitalId,
      departmentId,
      visitType,
      waitMinutes,
      consultationMinutes,
      date: today,
    });
  }

  private async incrementHospitalMetrics(
    hospitalId: string,
    departmentId: string,
    visitType: "appointment" | "walkin",
    waitMinutes: number,
    consultationMinutes: number,
    date: string
  ) {
    const { DailyHospitalMetricsModel } = await import("@/lib/models");
    await DailyHospitalMetricsModel.findOneAndUpdate(
      { hospitalId, date },
      {
        $inc: {
          totalVisits: 1,
          [`${visitType === "appointment" ? "appointments" : "walkIns"}`]: 1,
          completedVisits: 1,
        },
        $set: {
          avgWaitMinutes: waitMinutes, // Will be recalculated
          avgConsultationMinutes: consultationMinutes,
        },
        $addToSet: { departmentBreakdown: { departmentId } },
      },
      { upsert: true, new: true }
    );
  }

  async recalculateDistrictMetrics(districtId: string, ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);
    
    const hospitals = await hospitalRepository.findByDistrict(districtId, ctx);
    const today = new Date().toISOString().slice(0, 10);
    
    let totalVisits = 0;
    let completedVisits = 0;
    let appointments = 0;
    let walkIns = 0;
    let totalWaitMinutes = 0;
    let waitCount = 0;
    
    for (const h of hospitals) {
      const metrics = await analyticsRepository.getLatestHospitalMetrics(h.id, ctx);
      if (metrics) {
        totalVisits += metrics.totalVisits;
        completedVisits += metrics.completedVisits;
        appointments += metrics.appointments;
        walkIns += metrics.walkIns;
        if (metrics.avgWaitMinutes > 0) {
          totalWaitMinutes += metrics.avgWaitMinutes;
          waitCount++;
        }
      }
    }
    
    await analyticsRepository.upsertDistrictMetrics(districtId, {
      date: today,
      hospitals: hospitals.length,
      totalVisits,
      completedVisits,
      appointments,
      walkIns,
      totalWaiting: 0,
      avgWaitMinutes: waitCount ? Math.round(totalWaitMinutes / waitCount) : 0,
      departmentBreakdown: [],
      topDepartments: [],
      hospitalsByStatus: { normal: 0, highLoad: 0, critical: 0 },
      queueHealth: [] as any,
    } as any, ctx);
  }

  async recalculateStateMetrics(ctx: AccessContext) {
    assertAnyDistrictAccess(ctx);
    
    const { DISTRICTS } = await import("@/config/districts");
    const today = new Date().toISOString().slice(0, 10);
    
    let totalVisits = 0;
    let completedVisits = 0;
    let appointments = 0;
    let walkIns = 0;
    let hospitals = 0;
    let totalWaitMinutes = 0;
    let waitCount = 0;
    const districtBreakdown = [];
    
    for (const d of DISTRICTS) {
      try {
        assertDistrictAccess(ctx, d.id);
        const metrics = await analyticsRepository.getLatestDistrictMetrics(d.id, ctx);
        if (metrics) {
          totalVisits += metrics.totalVisits;
          completedVisits += metrics.completedVisits;
          appointments += metrics.appointments;
          walkIns += metrics.walkIns;
          if (metrics.avgWaitMinutes > 0) {
            totalWaitMinutes += metrics.avgWaitMinutes;
            waitCount++;
          }
          
          const hospitalCount = (await hospitalRepository.findByDistrict(d.id, ctx)).length;
          hospitals += hospitalCount;
          
          districtBreakdown.push({
            districtId: d.id,
            districtName: d.name,
            visits: metrics.totalVisits,
            avgWaitMinutes: metrics.avgWaitMinutes,
          });
        }
      } catch {
        // District not accessible
      }
    }
    
    await analyticsRepository.upsertStateMetrics({
      date: today,
      stateId: "KERALA",
      districts: DISTRICTS.length,
      activeHospitals: hospitals,
      totalVisits,
      completedVisits,
      appointments,
      walkIns,
      hospitals,
      avgWaitMinutes: waitCount ? Math.round(totalWaitMinutes / waitCount) : 0,
      noShowRate: 0,
      hospitalUtilization: 0,
      districtBreakdown,
    }, ctx);
  }

  async getHospitalMetrics(hospitalId: string, ctx: AccessContext) {
    assertHospitalAccess(ctx, hospitalId);
    return analyticsRepository.getLatestHospitalMetrics(hospitalId, ctx);
  }

  async getDistrictMetrics(districtId: string, ctx: AccessContext) {
    assertDistrictAccess(ctx, districtId);
    return analyticsRepository.getLatestDistrictMetrics(districtId, ctx);
  }

  async getStateMetrics(ctx: AccessContext) {
    assertAnyDistrictAccess(ctx);
    return analyticsRepository.getLatestStateMetrics(ctx);
  }
}

export const analyticsService = new AnalyticsService();
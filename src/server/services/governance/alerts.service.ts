"use server";

import "server-only";
import { alertRepository } from "@/server/repositories/governance.repository";
import type { AccessContext } from "@/server/lib/access-context";
import { assertDistrictAccess, assertAnyDistrictAccess, assertHospitalAccess } from "@/server/lib/scope-access";
import type { GovernmentAlert, GovernmentAlertSeverity, GovernmentAlertType } from "@/types";
import type { DistrictId } from "@/config/districts";
import { createOutboxEvent } from "@/server/services/outbox.service";

export class AlertsService {
  async createAlert(
    input: {
      type: GovernmentAlertType;
      severity: GovernmentAlertSeverity;
      message: string;
      districtId: string;
      hospitalId?: string;
      metadata?: Record<string, unknown>;
    },
    ctx: AccessContext
  ): Promise<GovernmentAlert> {
    assertDistrictAccess(ctx, input.districtId);
    if (input.hospitalId) assertHospitalAccess(ctx, input.hospitalId);

    const alert = await alertRepository.create({
      type: input.type,
      severity: input.severity,
      message: input.message,
      districtId: input.districtId as DistrictId,
      hospitalId: input.hospitalId ?? "",
      hospitalName: "",
      status: "open",
    }, ctx);

    await createOutboxEvent("GovernmentAlert", alert.id, "AlertCreated", {
      alertId: alert.id,
      type: input.type,
      severity: input.severity,
      districtId: input.districtId,
      hospitalId: input.hospitalId,
    });

    return alert;
  }

  async getActiveAlerts(districtId: string, ctx: AccessContext): Promise<GovernmentAlert[]> {
    assertDistrictAccess(ctx, districtId);
    return alertRepository.findActiveByDistrict(districtId, ctx);
  }

  async getStatewideAlerts(ctx: AccessContext): Promise<GovernmentAlert[]> {
    assertAnyDistrictAccess(ctx);
    return alertRepository.getStatewideAlerts(ctx);
  }

  async acknowledgeAlert(alertId: string, ctx: AccessContext): Promise<void> {
    const alert = await alertRepository.findById(alertId, ctx);
    if (!alert) throw new Error("Alert not found");
    
    assertDistrictAccess(ctx, alert.districtId);
    await alertRepository.acknowledge(alertId, ctx.userId, ctx);
  }

  async resolveAlert(alertId: string, ctx: AccessContext): Promise<void> {
    const alert = await alertRepository.findById(alertId, ctx);
    if (!alert) throw new Error("Alert not found");
    
    assertDistrictAccess(ctx, alert.districtId);
    await alertRepository.resolve(alertId, ctx);
  }

  async checkThresholds(ctx: AccessContext): Promise<void> {
    const { analyticsRepository } = await import("@/server/repositories/governance.repository");
    const { hospitalRepository } = await import("@/server/repositories/hospital.repository");
    const { DISTRICTS } = await import("@/config/districts");

    for (const d of DISTRICTS) {
      try {
        assertDistrictAccess(ctx, d.id);
        const hospitals = await hospitalRepository.findByDistrict(d.id, ctx);
        
        for (const h of hospitals) {
          const metrics = await analyticsRepository.getLatestHospitalMetrics(h.id, ctx);
          if (!metrics) continue;

          const waiting = metrics.totalWaiting || 0;
          
          if (waiting > 50) {
            const existing = await alertRepository.findActiveByType(h.id, "queue_backlog", ctx);
            if (!existing) {
              await this.createAlert({
                type: "queue_backlog",
                severity: "critical",
                message: `Queue backlog of ${waiting} patients at ${h.name}`,
                districtId: d.id,
                hospitalId: h.id,
                metadata: { waiting, threshold: 50 },
              }, ctx);
            }
          } else if (waiting > 25) {
            const existing = await alertRepository.findActiveByType(h.id, "high_wait", ctx);
            if (!existing) {
              await this.createAlert({
                type: "high_wait",
                severity: "warning",
                message: `High wait count (${waiting}) at ${h.name}`,
                districtId: d.id,
                hospitalId: h.id,
                metadata: { waiting, threshold: 25 },
              }, ctx);
            }
          }
        }

        const districtMetrics = await analyticsRepository.getLatestDistrictMetrics(d.id, ctx);
        if (districtMetrics && districtMetrics.totalVisits > 1000) {
          const existing = await alertRepository.findActiveByDistrictType(d.id, "high_volume", ctx);
          if (!existing) {
            await this.createAlert({
              type: "high_volume",
              severity: "warning",
              message: `High patient volume (${districtMetrics.totalVisits}) in ${d.name} district`,
              districtId: d.id,
              metadata: { volume: districtMetrics.totalVisits },
            }, ctx);
          }
        }
      } catch {
        // District not accessible
      }
    }
  }
}

export const alertsService = new AlertsService();
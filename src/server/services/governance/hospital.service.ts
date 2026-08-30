
import "server-only";
import { dbConnect } from "@/lib/db";
import {
  OpdSessionModel,
  DepartmentModel,
  DoctorModel,
  plain,
  plainList,
} from "@/lib/models";
import { analyticsRepository, alertRepository, capacityRepository, auditRepository } from "@/server/repositories/governance.repository";
import { hospitalRepository } from "@/server/repositories/hospital.repository";
import type { AccessContext } from "@/server/lib/access-context";
import { assertHospitalAccess } from "@/server/lib/scope-access";

export class HospitalService {
  async getDashboard(hospitalId: string, ctx: AccessContext) {
    assertHospitalAccess(ctx, hospitalId);

    const [metrics, alerts] = await Promise.all([
      analyticsRepository.getLatestHospitalMetrics(hospitalId, ctx),
      alertRepository.findByHospital(hospitalId, ctx),
    ]);

    return {
      metrics: {
        totalVisits: metrics?.totalVisits || 0,
        waiting: metrics?.totalWaiting || 0,
        avgWaitMinutes: metrics?.avgWaitMinutes || 0,
      },
      alerts: alerts.slice(0, 5).map((a) => ({
        id: a.id,
        title: a.type,
        severity: a.severity,
      })),
    };
  }

  async getCapacity(hospitalId: string, ctx: AccessContext) {
    assertHospitalAccess(ctx, hospitalId);
    return capacityRepository.getHospitalCapacity(hospitalId, ctx);
  }

  async getQueueStatus(hospitalId: string, ctx: AccessContext) {
    assertHospitalAccess(ctx, hospitalId);
    await dbConnect();

    const today = new Date().toISOString().slice(0, 10);
    const sessions = await OpdSessionModel.find({
      hospitalId,
      date: today,
      state: { $in: ["open", "active", "paused"] },
    }).lean();

    return sessions.map((s) => ({
      opdId: s.opdId,
      sessionId: s._id,
      departmentId: s.departmentId,
      doctorId: s.doctorId,
      state: s.state,
      tokensIssued: s.tokensIssued,
      tokensCompleted: s.tokensCompleted,
      waiting: s.tokensIssued - s.tokensCompleted,
      plannedCapacity: s.plannedCapacity,
      startTime: s.startTime,
      endTime: s.endTime,
      pauseReason: s.pauseReason,
    }));
  }

  async getDepartments(hospitalId: string, ctx: AccessContext) {
    assertHospitalAccess(ctx, hospitalId);
    await dbConnect();

    const departments = await DepartmentModel.find({ hospitalId }).lean();
    return departments.map((d) => ({
      id: String(d._id),
      name: d.name,
      code: d.code,
      waitingCount: d.waitingCount,
      status: d.status,
      dailyCapacity: d.dailyCapacity,
      avgConsultationMinutes: d.avgConsultationMinutes,
      appointmentAllocationPct: d.appointmentAllocationPct,
      walkInAllocationPct: d.walkInAllocationPct,
    }));
  }

  async getDoctors(hospitalId: string, ctx: AccessContext) {
    assertHospitalAccess(ctx, hospitalId);
    await dbConnect();

    const doctors = await DoctorModel.find({ hospitalId }).lean();
    return doctors.map((d) => ({
      id: String(d._id),
      name: d.name,
      speciality: d.speciality,
      departmentId: d.departmentId,
      status: d.status,
      phone: d.phone,
      email: d.email,
      opdIds: d.opdIds,
      joinedAt: d.joinedAt,
    }));
  }
}

export const hospitalService = new HospitalService();

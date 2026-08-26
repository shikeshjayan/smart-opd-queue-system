"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  AppointmentModel,
  QueueEntryModel,
  QueueAuditModel,
  DepartmentModel,
  DoctorModel,
  StaffLeaveModel,
  AdminSettingsModel,
  DiagnosticOrderModel,
  MedicineStockModel,
  OpdSessionModel,
} from "@/lib/models";
import { plainList } from "@/lib/models";
import { requireHospitalAccess } from "@/server/lib/access";

export type HospitalDashboard = {
  opdPatients: number;
  appointments: number;
  walkIns: number;
  waiting: number;
  inConsultation: number;
  completed: number;
  avgWaitMinutes: number;
  doctorsActive: number;
  departmentsActive: number;
};

export type OperationalAlert = {
  id: string;
  type:
    | "queue_high"
    | "doctor_absent"
    | "lab_backlog"
    | "low_stock"
    | "diagnostic_delay"
    | "session_paused";
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Today's operational overview for one hospital (spec §23). */
export async function opsHospitalDashboard(hospitalId: string): Promise<HospitalDashboard> {
  await dbConnect();
  await requireHospitalAccess("VIEW_HOSPITAL_DASHBOARD", hospitalId);
  const date = todayISO();

  const [departments, appointments, sessions] = await Promise.all([
    DepartmentModel.find({ hospitalId }).lean<Record<string, unknown>[]>(),
    AppointmentModel.find({ hospitalId, date }).lean<Record<string, unknown>[]>(),
    OpdSessionModel.find({ hospitalId, date }).select("_id").lean<{ _id: string }[]>(),
  ]);
  const sessionIds = new Set(sessions.map((s) => String(s._id)));

  const queue = await QueueEntryModel.find({
    $or: [
      { sessionId: { $in: [...sessionIds] } },
      { sessionId: null },
    ],
  })
    .select("status priority metadata createdAt updatedAt")
    .lean<Record<string, unknown>[]>();

  let walkIns = 0;
  for (const q of queue) {
    const meta = (q.metadata ?? {}) as { source?: string };
    if (!meta.source || meta.source === "walk_in") walkIns += 1;
  }

  const waiting = queue.filter((q) => q.status === "waiting").length;
  const inConsultation = queue.filter((q) => q.status === "in_consultation" || q.status === "called").length;
  const completed = queue.filter((q) => q.status === "completed").length;

  // Average wait: time from token creation to first call today.
  const audits = await QueueAuditModel.find({
    timestamp: { $gte: new Date(`${date}T00:00:00`) },
    fromStatus: "waiting",
    toStatus: "called",
  })
    .select("durationMs")
    .lean<{ durationMs?: number | null }[]>();
  const durations = audits.map((a) => a.durationMs).filter((d): d is number => typeof d === "number");
  const avgWaitMinutes = durations.length
    ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length / 60000)
    : 0;

  const [doctorsActive, staffOnLeaveToday] = await Promise.all([
    DoctorModel.countDocuments({ hospitalId, status: "active" }),
    StaffLeaveModel.countDocuments({
      hospitalId,
      status: "approved",
      fromDate: { $lte: date },
      toDate: { $gte: date },
    }),
  ]);

  return {
    opdPatients: appointments.length + walkIns,
    appointments: appointments.length,
    walkIns,
    waiting,
    inConsultation,
    completed,
    avgWaitMinutes,
    doctorsActive: Math.max(0, doctorsActive - staffOnLeaveToday),
    departmentsActive: departments.filter((d) => d.status === "active").length,
  };
}

/** Derived operational alerts (spec §24). */
export async function opsOperationalAlerts(hospitalId: string): Promise<OperationalAlert[]> {
  await dbConnect();
  await requireHospitalAccess("VIEW_HOSPITAL_DASHBOARD", hospitalId);
  const date = todayISO();
  const alerts: OperationalAlert[] = [];

  const [settings, departments] = await Promise.all([
    AdminSettingsModel.findOne({ hospitalId }).lean<{ queueHealthThresholds?: { warning: number; critical: number } }>(),
    DepartmentModel.find({ hospitalId, status: "active" }).select("name waitingCount").lean<{
      _id: string;
      name: string;
      waitingCount: number;
    }[]>(),
  ]);
  const thresholds =
    settings?.queueHealthThresholds ?? ({ warning: 12, critical: 25 } as { warning: number; critical: number });

  // Queue pressure per department.
  for (const dept of departments) {
    if (dept.waitingCount >= thresholds.critical) {
      alerts.push({
        id: `queue-critical-${dept._id}`,
        type: "queue_high",
        severity: "critical",
        title: `${dept.name}: queue critical`,
        detail: `${dept.waitingCount} patients waiting — above the critical threshold (${thresholds.critical}). Consider opening another window.`,
      });
    } else if (dept.waitingCount >= thresholds.warning) {
      alerts.push({
        id: `queue-warning-${dept._id}`,
        type: "queue_high",
        severity: "warning",
        title: `${dept.name}: queue high`,
        detail: `${dept.waitingCount} patients waiting — at or above the warning threshold (${thresholds.warning}).`,
      });
    }
  }

  // Doctors absent on approved leave today.
  const leaves = await StaffLeaveModel.find({
    hospitalId,
    status: "approved",
    fromDate: { $lte: date },
    toDate: { $gte: date },
  })
    .select("staffId")
    .lean<{ staffId: string }[]>();
  for (const leave of leaves) {
    const doctor = await DoctorModel.findOne({ _id: leave.staffId })
      .select("name departmentId")
      .lean<{ name: string; departmentId: string }>();
    if (doctor) {
      alerts.push({
        id: `leave-${leave.staffId}`,
        type: "doctor_absent",
        severity: "warning",
        title: `${doctor.name} on leave`,
        detail: "Approved leave covers today. Future appointment availability has been reduced.",
      });
    }
  }

  // Paused sessions right now.
  const paused = await OpdSessionModel.find({ hospitalId, date, state: "paused" })
    .select("departmentId pauseReason")
    .lean<{ departmentId: string; pauseReason: string | null }[]>();
  for (const p of paused) {
    const dept = await DepartmentModel.findById(p.departmentId).select("name").lean<{ name: string }>();
    alerts.push({
      id: `paused-${p.departmentId}`,
      type: "session_paused",
      severity: "critical",
      title: `${dept?.name ?? "OPD"} paused`,
      detail: p.pauseReason ?? "Session paused.",
    });
  }

  // Lab backlog: pending diagnostic orders older than today.
  const labBacklog = await DiagnosticOrderModel.countDocuments({
    hospitalId,
    status: { $in: ["ordered", "sample_collected", "in_progress"] },
    createdAt: { $lt: new Date(`${date}T00:00:00`) },
  });
  if (labBacklog >= 10) {
    alerts.push({
      id: "lab-backlog",
      type: "lab_backlog",
      severity: labBacklog >= 25 ? "critical" : "warning",
      title: "Lab backlog high",
      detail: `${labBacklog} diagnostic orders still pending from previous days.`,
    });
  }

  // Low stock: medicine batches below their configured minimum level.
  const lowStock = await MedicineStockModel.find({
    hospitalId,
    $expr: { $lte: ["$quantity", "$minLevel"] },
  })
    .select("medicineName quantity minLevel")
    .limit(5)
    .lean<{ medicineName: string; quantity: number; minLevel: number }[]>();
  for (const stock of lowStock) {
    alerts.push({
      id: `stock-${stock.medicineName}`,
      type: "low_stock",
      severity: "warning",
      title: `Low stock: ${stock.medicineName}`,
      detail: `${stock.quantity} remaining, below minimum level of ${stock.minLevel}.`,
    });
  }

  const severityRank = { critical: 0, warning: 1, info: 2 } as const;
  return alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

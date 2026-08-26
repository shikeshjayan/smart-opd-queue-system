"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  HospitalClosureModel,
  AppointmentModel,
  DepartmentModel,
  HospitalModel,
  ScheduleConfigModel,
  nextSequence,
  plain,
  plainList,
} from "@/lib/models";
import { requireHospitalAccess } from "@/server/lib/access";
import { isOperatingDay, isDoctorOnLeave, weekdayOf } from "@/server/lib/availability";
import { auditOps } from "@/server/lib/audit";
import { notify } from "@/server/notifications/service";
import { broadcastToServer } from "@/features/realtime/server/broadcast";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ───────── Closures ───────── */

export async function opsCreateClosure(input: {
  hospitalId: string;
  scope: "hospital" | "department";
  departmentId?: string | null;
  type: "holiday" | "maintenance" | "emergency";
  fromDate: string;
  toDate: string;
  reason: string;
}): Promise<{ id: string; affectedTotal: number }> {
  await dbConnect();
  const user = await requireHospitalAccess("MANAGE_CLOSURES", input.hospitalId);
  if (input.toDate < input.fromDate) throw new Error("Closure end date is before start date.");
  if (input.scope === "department" && !input.departmentId) {
    throw new Error("Department closures need a department.");
  }

  // Impact preview: scheduled/confirmed appointments in range & scope.
  const query: Record<string, unknown> = {
    hospitalId: input.hospitalId,
    date: { $gte: input.fromDate, $lte: input.toDate },
    status: { $in: ["scheduled", "confirmed"] },
  };
  if (input.scope === "department") query.departmentId = input.departmentId;
  const affectedTotal = await AppointmentModel.countDocuments(query);

  const n = await nextSequence("hospitalclosure");
  const doc = await HospitalClosureModel.create({
    _id: `closure_${String(n).padStart(3, "0")}`,
    hospitalId: input.hospitalId,
    scope: input.scope,
    departmentId: input.scope === "department" ? input.departmentId : null,
    type: input.type,
    fromDate: input.fromDate,
    toDate: input.toDate,
    reason: input.reason.trim(),
    status: input.fromDate <= todayISO() ? "active" : "planned",
    affectedTotal,
    createdBy: user.id,
    createdByName: user.name,
    createdAt: new Date().toISOString(),
  });

  await broadcastToServer({
    type: "CLOSURE_CREATED",
    at: new Date().toISOString(),
    hospitalId: input.hospitalId,
    actorId: user.id,
    resourceType: "hospital_closure",
    resourceId: String(doc._id),
  });

  auditOps(user, {
    action: "closure_created",
    resourceType: "hospital_closure",
    resourceId: String(doc._id),
    hospitalId: input.hospitalId,
    detail: { ...input, affectedTotal },
  });

  return { id: String(doc._id), affectedTotal };
}

export async function opsListClosures(hospitalId: string) {
  await dbConnect();
  await requireHospitalAccess("VIEW_QUEUE", hospitalId);
  const docs = await HospitalClosureModel.find({ hospitalId })
    .sort({ fromDate: -1 })
    .limit(100)
    .lean();
  const departments = await DepartmentModel.find({ hospitalId })
    .select("_id name")
    .lean<{ _id: string; name: string }[]>();
  const names = new Map(departments.map((d) => [String(d._id), d.name]));
  return (plainList(docs) as Array<Record<string, unknown>>).map((c) => ({
    ...c,
    departmentName: c.departmentId ? names.get(String(c.departmentId)) ?? null : null,
  }));
}

/**
 * Bulk-reschedule affected appointments to the next operating day of
 * their department (same time-of-day). Patients are notified. Never
 * deletes anything.
 */
export async function opsRescheduleAffected(closureId: string): Promise<{ rescheduled: number }> {
  await dbConnect();
  const closureDoc = await HospitalClosureModel.findById(closureId).lean<Record<string, unknown>>();
  if (!closureDoc) throw new Error("Closure not found.");
  const closure = closureDoc as unknown as {
    hospitalId: string;
    scope: string;
    departmentId: string | null;
    fromDate: string;
    toDate: string;
    affectedRescheduled: number;
    affectedCancelled: number;
  };
  const user = await requireHospitalAccess("MANAGE_CLOSURES", closure.hospitalId);

  const query: Record<string, unknown> = {
    hospitalId: closure.hospitalId,
    date: { $gte: closure.fromDate, $lte: closure.toDate },
    status: { $in: ["scheduled", "confirmed"] },
  };
  if (closure.scope === "department") query.departmentId = closure.departmentId;

  const appointments = await AppointmentModel.find(query)
    .sort({ date: 1 })
    .limit(500)
    .lean<Record<string, unknown>[]>();

  const [hospital, departments] = await Promise.all([
    HospitalModel.findById(closure.hospitalId).select("name").lean<{ name: string }>(),
    DepartmentModel.find({ hospitalId: closure.hospitalId })
      .select("_id")
      .lean<{ _id: string }[]>(),
  ]);
  const deptIds = new Set(departments.map((d) => String(d._id)));

  let rescheduled = 0;
  for (const appt of appointments) {
    const departmentId = String(appt.departmentId ?? "");
    const newDate = await findNextOperatingDay(
      closure.hospitalId,
      departmentId,
      deptIds.has(departmentId),
      closure.toDate
    );
    if (!newDate) continue;

    const doctorId = appt.doctorId ? String(appt.doctorId) : "";
    if (doctorId && (await isDoctorOnLeave(doctorId, newDate))) continue;

    await AppointmentModel.updateOne(
      { _id: appt._id, status: { $in: ["scheduled", "confirmed"] } },
      {
        $set: {
          date: newDate,
          status: "rescheduled",
          rescheduledFrom: `${appt.date} ${appt.time}`,
          rescheduledTo: `${newDate} ${appt.time}`,
        },
      }
    );

    if (appt.patientId) {
      const dept = departmentId
        ? await DepartmentModel.findById(departmentId).select("name").lean<{ name: string }>()
        : null;
      await notify({
        userId: String(appt.patientId),
        templateKey: "APPOINTMENT_RESCHEDULED",
        params: {
          hospital: hospital?.name ?? "",
          department: dept?.name ?? "",
          date: newDate,
          time: String(appt.time ?? ""),
          appointmentId: String(appt._id),
        },
        idempotencyKey: `appointment:${String(appt._id)}:rescheduled:${newDate}`,
        hospitalId: closure.hospitalId,
        resourceType: "appointment",
        resourceId: String(appt._id),
      });
    }
    rescheduled += 1;
  }

  await HospitalClosureModel.updateOne(
    { _id: closureId },
    {
      $inc: { affectedRescheduled: rescheduled },
      $set: { status: "resolved" },
    }
  );

  auditOps(user, {
    action: "closure_resolved",
    resourceType: "hospital_closure",
    resourceId: closureId,
    hospitalId: closure.hospitalId,
    detail: { rescheduled },
  });
  return { rescheduled };
}

async function findNextOperatingDay(
  hospitalId: string,
  departmentId: string,
  knownDepartment: boolean,
  afterDate: string
): Promise<string | null> {
  if (!knownDepartment || !departmentId) return null;
  const config = await ScheduleConfigModel.findOne({ hospitalId, departmentId }).lean<{
    workdays: number[];
    holidays: string[];
  }>();
  if (!config) return null;

  for (let i = 1; i <= 21; i += 1) {
    const candidate = new Date(new Date(`${afterDate}T00:00:00`).getTime() + i * 86400000)
      .toISOString()
      .slice(0, 10);
    // Skip other closures overlapping the candidate day.
    const closure = await HospitalClosureModel.findOne({
      hospitalId,
      status: { $in: ["planned", "active"] },
      fromDate: { $lte: candidate },
      toDate: { $gte: candidate },
    })
      .select("_id")
      .lean();
    if (closure) continue;
    if (await isOperatingDay(candidate, hospitalId, departmentId, config)) return candidate;
  }
  return null;
}

/** Cancel affected appointments with patient notification (policy-required template). */
export async function opsCancelAffected(closureId: string): Promise<{ cancelled: number }> {
  await dbConnect();
  const closureDoc = await HospitalClosureModel.findById(closureId).lean<Record<string, unknown>>();
  if (!closureDoc) throw new Error("Closure not found.");
  const closure = closureDoc as unknown as {
    hospitalId: string;
    scope: string;
    departmentId: string | null;
    fromDate: string;
    toDate: string;
  };
  const user = await requireHospitalAccess("MANAGE_CLOSURES", closure.hospitalId);

  const query: Record<string, unknown> = {
    hospitalId: closure.hospitalId,
    date: { $gte: closure.fromDate, $lte: closure.toDate },
    status: { $in: ["scheduled", "confirmed"] },
  };
  if (closure.scope === "department") query.departmentId = closure.departmentId;

  const appointments = await AppointmentModel.find(query)
    .limit(500)
    .lean<Record<string, unknown>[]>();
  const [hospital, departments] = await Promise.all([
    HospitalModel.findById(closure.hospitalId).select("name").lean<{ name: string }>(),
    DepartmentModel.find({ hospitalId: closure.hospitalId }).select("_id").lean<{ _id: string }[]>(),
  ]);
  void departments;

  let cancelled = 0;
  for (const appt of appointments) {
    await AppointmentModel.updateOne(
      { _id: appt._id, status: { $in: ["scheduled", "confirmed"] } },
      { $set: { status: "cancelled" } }
    );
    if (appt.patientId) {
      const dept = appt.departmentId
        ? await DepartmentModel.findById(String(appt.departmentId)).select("name").lean<{ name: string }>()
        : null;
      await notify({
        userId: String(appt.patientId),
        templateKey: "APPOINTMENT_CANCELLED",
        params: {
          hospital: hospital?.name ?? "",
          department: dept?.name ?? "",
          date: String(appt.date ?? ""),
          time: String(appt.time ?? ""),
          appointmentId: String(appt._id),
        },
        idempotencyKey: `appointment:${String(appt._id)}:cancelled`,
        hospitalId: closure.hospitalId,
        resourceType: "appointment",
        resourceId: String(appt._id),
      });
    }
    cancelled += 1;
  }

  await HospitalClosureModel.updateOne(
    { _id: closureId },
    {
      $inc: { affectedCancelled: cancelled },
      $set: { status: "resolved" },
    }
  );

  auditOps(user, {
    action: "closure_cancelled_appointments",
    resourceType: "hospital_closure",
    resourceId: closureId,
    hospitalId: closure.hospitalId,
    detail: { cancelled },
  });
  return { cancelled };
}

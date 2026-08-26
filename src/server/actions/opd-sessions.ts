"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  OpdSessionModel,
  DepartmentModel,
  OpdModel,
  RoomModel,
  ScheduleConfigModel,
  HospitalClosureModel,
  QueueEntryModel,
  plainList,
} from "@/lib/models";
import { requireHospitalAccess } from "@/server/lib/access";
import { isOperatingDay, isDoctorOnLeave } from "@/server/lib/availability";
import { auditOps } from "@/server/lib/audit";
import { notify } from "@/server/notifications/service";
import { broadcastToServer } from "@/features/realtime/server/broadcast";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function emitSessionEvent(
  type:
    | "SESSION_OPENED"
    | "SESSION_ACTIVATED"
    | "SESSION_PAUSED"
    | "SESSION_RESUMED"
    | "SESSION_COMPLETED"
    | "SESSION_CANCELLED",
  session: Record<string, unknown>,
  actorId: string,
  reason?: string
): Promise<void> {
  await broadcastToServer({
    type,
    at: new Date().toISOString(),
    hospitalId: String(session.hospitalId ?? ""),
    actorId,
    sessionId: String(session._id ?? ""),
    opdId: String(session.opdId ?? ""),
    departmentId: session.departmentId ? String(session.departmentId) : undefined,
    reason,
  });
}

/* ───────── Materialization ───────── */

/**
 * Create scheduled sessions for every department scheduled to run on
 * this date (schedule grid minus closures minus approved leaves).
 * Idempotent: one session per schedule-config per date.
 */
export async function ensureSessionsForDate(hospitalId: string, date = todayISO()): Promise<number> {
  await dbConnect();
  await requireHospitalAccess("VIEW_QUEUE", hospitalId);

  const configs = await ScheduleConfigModel.find({ hospitalId }).lean<
    Record<string, unknown>[]
  >();
  const created = await createSessionsForConfigs(hospitalId, date, configs);
  return created.length;
}

export async function ensureSessionsForDepartment(
  hospitalId: string,
  departmentId: string,
  date = todayISO()
): Promise<void> {
  await dbConnect();
  await requireHospitalAccess("VIEW_QUEUE", hospitalId);
  const configs = await ScheduleConfigModel.find({ hospitalId, departmentId }).lean<
    Record<string, unknown>[]
  >();
  await createSessionsForConfigs(hospitalId, date, configs);
}

async function createSessionsForConfigs(
  hospitalId: string,
  date: string,
  configs: Record<string, unknown>[]
): Promise<string[]> {
  if (!(await isHospitalOpenOn(hospitalId, date))) return [];

  const createdIds: string[] = [];
  for (const config of configs) {
    const departmentId = String(config.departmentId ?? "");
    if (!departmentId) continue;
    if (!(await isOperatingDay(date, hospitalId, departmentId, config as never))) continue;
    if (config.doctorId && (await isDoctorOnLeave(String(config.doctorId), date))) continue;

    // One session per department per day (single window from the config;
    // multi-window grids land with per-day session templates).
    const sessionId = `ses_${departmentId}_${date}`;
    const exists = await OpdSessionModel.findById(sessionId).select("_id").lean();
    if (exists) continue;

    const [dept, opd] = await Promise.all([
      DepartmentModel.findById(departmentId).lean<Record<string, unknown>>(),
      OpdModel.findOne({ departmentId }).sort({ startTime: 1 }).lean<Record<string, unknown>>(),
    ]);
    if (!dept || dept.status !== "active") continue;

    // Planned capacity: slot math capped by configured daily capacity.
    const openTime = (config.openTime as string) ?? "09:00";
    const closeTime = (config.closeTime as string) ?? "13:00";
    const duration = Number(config.slotDurationMinutes ?? 15);
    const maxPerSlot = Number(config.maxBookingsPerSlot ?? 5);
    const mins = timeToMinutes(openTime);
    const closeMins = timeToMinutes(closeTime);
    const slotCount = duration > 0 ? Math.max(0, Math.floor((closeMins - mins) / duration)) : 0;
    const slotCapacity = slotCount * maxPerSlot;
    const dailyCap = dept.dailyCapacity as number | null;
    const plannedCapacity =
      dailyCap != null ? Math.min(dailyCap, slotCapacity) : slotCapacity;

    // Auto-assign an active OPD room for this department (or any free one).
    const roomId = await pickRoom(hospitalId, departmentId);

    await OpdSessionModel.create({
      _id: sessionId,
      hospitalId,
      departmentId,
      opdId: opd ? String(opd._id) : departmentId, // legacy rows use dep-id convention
      doctorId: (config.doctorId as string) || null,
      roomId,
      shiftId: null,
      date,
      startTime: openTime,
      endTime: closeTime,
      state: "scheduled",
      plannedCapacity,
      tokensIssued: 0,
      tokensCompleted: 0,
    });
    createdIds.push(sessionId);
  }
  return createdIds;
}

async function isHospitalOpenOn(hospitalId: string, date: string): Promise<boolean> {
  const closures = await HospitalClosureModel.find({
    hospitalId,
    status: { $in: ["planned", "active"] },
    fromDate: { $lte: date },
    toDate: { $gte: date },
  })
    .select("scope")
    .lean<{ scope: string }[]>();
  return !closures.some((c) => c.scope === "hospital");
}

async function pickRoom(hospitalId: string, departmentId: string): Promise<string | null> {
  const rooms = await RoomModel.find({ hospitalId, status: "active" })
    .sort({ code: 1 })
    .lean<{ _id: string; departmentId: string | null }[]>();
  const deptRoom = rooms.find((r) => r.departmentId === departmentId);
  return String((deptRoom ?? rooms[0])?._id ?? "") || null;
}

function timeToMinutes(t: string): number {
  const [h = "0", m = "0"] = t.split(":");
  return parseInt(h) * 60 + parseInt(m);
}

/* ───────── Queries ───────── */

export async function opsListSessions(hospitalId: string, date = todayISO()) {
  await dbConnect();
  await requireHospitalAccess("VIEW_QUEUE", hospitalId);
  await ensureSessionsForDate(hospitalId, date);

  const docs = await OpdSessionModel.find({ hospitalId, date }).lean();
  const sessions = plainList(docs) as Array<Record<string, unknown>>;
  const [departments, rooms] = await Promise.all([
    DepartmentModel.find({ hospitalId }).select("name").lean<{ _id: string; name: string }[]>(),
    RoomModel.find({ hospitalId }).select("code").lean<{ _id: string; code: string }[]>(),
  ]);
  const deptNames = new Map(departments.map((d) => [String(d._id), d.name]));
  const roomCodes = new Map(rooms.map((r) => [String(r._id), r.code]));
  return sessions.map((s) => ({
    ...s,
    departmentName: deptNames.get(String(s.departmentId)) ?? String(s.departmentId),
    roomCode: s.roomId ? roomCodes.get(String(s.roomId)) ?? null : null,
  }));
}

export async function opsGetSession(sessionId: string) {
  await dbConnect();
  const doc = await OpdSessionModel.findById(sessionId).lean();
  if (!doc) return null;
  const session = doc as unknown as Record<string, unknown>;
  await requireHospitalAccess("VIEW_QUEUE", String(session.hospitalId));
  return session;
}

/** Waiting queue scoped to a session, ordered by priority then token. */
export async function opsListSessionQueue(sessionId: string) {
  await dbConnect();
  const docs = await QueueEntryModel.find({ sessionId, status: "waiting" })
    .sort({ priority: 1, tokenNumber: 1 })
    .lean();
  return plainList(docs);
}

/* ───────── Lifecycle ───────── */

const OPENABLE = ["scheduled"] as const;

export async function opsOpenSession(sessionId: string): Promise<void> {
  await dbConnect();
  const doc = await OpdSessionModel.findById(sessionId).lean<Record<string, unknown>>();
  if (!doc) throw new Error("Session not found.");
  const user = await requireHospitalAccess("MANAGE_SESSIONS", String(doc.hospitalId));
  if (!OPENABLE.includes(doc.state as never)) {
    throw new Error(`Cannot open a session in state '${doc.state}'.`);
  }
  await OpdSessionModel.updateOne(
    { _id: sessionId },
    { $set: { state: "open", openedAt: new Date().toISOString() } }
  );
  await emitSessionEvent("SESSION_OPENED", doc, user.id);
  auditOps(user, {
    action: "session_opened",
    resourceType: "opd_session",
    resourceId: sessionId,
    hospitalId: String(doc.hospitalId),
  });
}

export async function opsActivateSession(sessionId: string): Promise<void> {
  await dbConnect();
  const doc = await OpdSessionModel.findById(sessionId).lean<Record<string, unknown>>();
  if (!doc) throw new Error("Session not found.");
  const user = await requireHospitalAccess("MANAGE_SESSIONS", String(doc.hospitalId));
  if (doc.state !== "open") {
    throw new Error(`Cannot activate a session in state '${doc.state}'.`);
  }
  await OpdSessionModel.updateOne(
    { _id: sessionId },
    { $set: { state: "active" } }
  );
  await emitSessionEvent("SESSION_ACTIVATED", doc, user.id);
  auditOps(user, {
    action: "session_activated",
    resourceType: "opd_session",
    resourceId: sessionId,
    hospitalId: String(doc.hospitalId),
  });
}

/** Pause with reason + expected resume; waiting patients get a delay notice. */
export async function opsPauseSession(
  sessionId: string,
  reason: string,
  expectedResumeMinutes?: number
): Promise<void> {
  await dbConnect();
  const doc = await OpdSessionModel.findById(sessionId).lean<Record<string, unknown>>();
  if (!doc) throw new Error("Session not found.");
  const user = await requireHospitalAccess("MANAGE_OPD", String(doc.hospitalId));
  if (!["open", "active"].includes(String(doc.state))) {
    throw new Error(`Cannot pause a session in state '${doc.state}'.`);
  }
  const expectedResumeAt = expectedResumeMinutes
    ? new Date(Date.now() + expectedResumeMinutes * 60000).toISOString()
    : null;
  await OpdSessionModel.updateOne(
    { _id: sessionId },
    {
      $set: {
        state: "paused",
        pauseReason: reason.trim(),
        expectedResumeAt,
        pausedAt: new Date().toISOString(),
      },
    }
  );

  // Notify waiting patients of this session (§17).
  const waiting = await QueueEntryModel.find({ sessionId, status: "waiting" })
    .select("patientId tokenNumber")
    .lean<{ patientId: string | null; tokenNumber: string }[]>();
  const dept = await DepartmentModel.findById(String(doc.departmentId))
    .select("name")
    .lean<{ name: string }>();
  const eta = String(expectedResumeMinutes ?? reason.match(/\d+/)?.[0] ?? 40);
  for (const w of waiting) {
    if (!w.patientId) continue;
    await notify({
      userId: w.patientId,
      templateKey: "QUEUE_DELAYED",
      params: { department: dept?.name ?? "", eta, token: w.tokenNumber },
      idempotencyKey: `session:${sessionId}:delayed`,
      hospitalId: String(doc.hospitalId),
      audience: "patient",
      resourceType: "opd_session",
      resourceId: sessionId,
    });
  }

  await emitSessionEvent("SESSION_PAUSED", doc, user.id, reason);
  auditOps(user, {
    action: "session_paused",
    resourceType: "opd_session",
    resourceId: sessionId,
    hospitalId: String(doc.hospitalId),
    detail: { reason, expectedResumeMinutes },
  });
}

export async function opsResumeSession(sessionId: string): Promise<void> {
  await dbConnect();
  const doc = await OpdSessionModel.findById(sessionId).lean<Record<string, unknown>>();
  if (!doc) throw new Error("Session not found.");
  const user = await requireHospitalAccess("MANAGE_OPD", String(doc.hospitalId));
  if (doc.state !== "paused") {
    throw new Error(`Cannot resume a session in state '${doc.state}'.`);
  }
  await OpdSessionModel.updateOne(
    { _id: sessionId },
    {
      $set: { state: "active", resumedAt: new Date().toISOString(), pauseReason: null, expectedResumeAt: null },
    }
  );
  await emitSessionEvent("SESSION_RESUMED", doc, user.id, doc.pauseReason ? String(doc.pauseReason) : undefined);
  auditOps(user, {
    action: "session_resumed",
    resourceType: "opd_session",
    resourceId: sessionId,
    hospitalId: String(doc.hospitalId),
  });
}

export async function opsCompleteSession(sessionId: string): Promise<void> {
  await dbConnect();
  const doc = await OpdSessionModel.findById(sessionId).lean<Record<string, unknown>>();
  if (!doc) throw new Error("Session not found.");
  const user = await requireHospitalAccess("MANAGE_SESSIONS", String(doc.hospitalId));
  if (!["active", "paused", "open"].includes(String(doc.state))) {
    throw new Error(`Cannot complete a session in state '${doc.state}'.`);
  }
  await OpdSessionModel.updateOne(
    { _id: sessionId },
    { $set: { state: "completed", completedAt: new Date().toISOString() } }
  );
  await emitSessionEvent("SESSION_COMPLETED", doc, user.id);
  auditOps(user, {
    action: "session_completed",
    resourceType: "opd_session",
    resourceId: sessionId,
    hospitalId: String(doc.hospitalId),
  });
}

export async function opsCancelSession(sessionId: string, reason: string): Promise<void> {
  await dbConnect();
  const doc = await OpdSessionModel.findById(sessionId).lean<Record<string, unknown>>();
  if (!doc) throw new Error("Session not found.");
  const user = await requireHospitalAccess("MANAGE_SESSIONS", String(doc.hospitalId));
  if (["completed", "cancelled"].includes(String(doc.state))) {
    throw new Error(`Cannot cancel a session in state '${doc.state}'.`);
  }
  await OpdSessionModel.updateOne(
    { _id: sessionId },
    {
      $set: {
        state: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancelReason: reason.trim(),
      },
    }
  );

  // Release still-waiting tokens out of the cancelled session.
  await QueueEntryModel.updateMany(
    { sessionId, status: "waiting" },
    { $set: { status: "cancelled", updatedAt: new Date().toISOString() } }
  );

  await emitSessionEvent("SESSION_CANCELLED", doc, user.id, reason);
  auditOps(user, {
    action: "session_cancelled",
    resourceType: "opd_session",
    resourceId: sessionId,
    hospitalId: String(doc.hospitalId),
    detail: { reason },
  });
}

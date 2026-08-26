"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { QueueEntryModel, QueueAuditModel, OpdModel, HospitalModel, DepartmentModel, DoctorModel, OpdSessionModel } from "@/lib/models";
import { plain } from "@/lib/models";
import { notify } from "@/server/notifications/service";

async function deptInfo(opdId: string): Promise<{ hospitalName: string; departmentName: string }> {
  const opd = await OpdModel.findById(opdId).select("hospitalId departmentId").lean() as any;
  if (!opd) return { hospitalName: "", departmentName: "" };
  const [hosp, dept] = await Promise.all([
    HospitalModel.findById(opd.hospitalId).select("name").lean() as Promise<any>,
    DepartmentModel.findById(opd.departmentId).select("name").lean() as Promise<any>,
  ]);
  return { hospitalName: hosp?.name ?? "", departmentName: dept?.name ?? "" };
}

const GRACE_PERIOD_MS = 5 * 60 * 1000;

async function audit(opdId: string, tokenNumber: string, patientId: string, patientName: string, fromStatus: string, toStatus: string, actorId: string, metadata?: Record<string, unknown>) {
  await QueueAuditModel.create({
    opdId, tokenNumber, patientId, patientName,
    fromStatus, toStatus, actorId,
    timestamp: new Date(),
    metadata,
  });
}

function sortWaiting(entries: Array<{ tokenNumber: string; priority: string; overrideAhead?: boolean }>) {
  const rank = (p: string) => (p === "emergency" ? 0 : p === "priority" ? 1 : 2);
  return [...entries].sort((a, b) => {
    if (a.overrideAhead && !b.overrideAhead) return -1;
    if (!a.overrideAhead && b.overrideAhead) return 1;
    const r = rank(a.priority) - rank(b.priority);
    if (r !== 0) return r;
    return (a.tokenNumber ?? "").localeCompare(b.tokenNumber ?? "");
  });
}

export async function listQueue(opdId: string) {
  await dbConnect();
  const docs = await QueueEntryModel.find({ opdId }).sort({ tokenNumber: 1 }).lean();
  return (docs as any[]).map(d => plain(d));
}

export async function getOpdById(opdId: string) {
  await dbConnect();
  const doc = await OpdModel.findOne({ _id: opdId }).lean();
  return plain(doc);
}

export async function getQueueCounts(opdId: string) {
  await dbConnect();
  const entries = await QueueEntryModel.find({ opdId }).lean<{ status: string }[]>();
  const counts = { total: entries.length, completed: 0, waiting: 0, skipped: 0, inConsultation: 0, cancelled: 0 };
  for (const e of entries) {
    if (e.status === "completed") counts.completed++;
    else if (e.status === "waiting") counts.waiting++;
    else if (e.status === "skipped") counts.skipped++;
    else if (e.status === "in_consultation") counts.inConsultation++;
    else if (e.status === "cancelled") counts.cancelled++;
  }
  return counts;
}

export async function orderWaitingEntries(entries: any[]) {
  return sortWaiting(entries);
}

export async function callNextEntry(opdId: string, actorId = "system") {
  await dbConnect();

  // Session-scoped calling (Phase 26): prefer today's live session for
  // this OPD; fall back to the legacy opd-wide queue when no session
  // exists so older flows keep working unchanged.
  const date = new Date().toISOString().split("T")[0];
  const liveSession =
    (await OpdSessionModel.findOne({ opdId, date, state: "active" }).select("_id").lean()) ??
    (await OpdSessionModel.findOne({ opdId, date, state: "open" }).select("_id").lean());
  const sessionId = liveSession ? String((liveSession as unknown as { _id: string })._id) : null;

  const entry = await QueueEntryModel.findOneAndUpdate(
    sessionId
      ? { sessionId, status: "waiting" }
      : { opdId, status: "waiting", sessionId: null },
    { $set: { status: "called", updatedAt: new Date().toISOString() } },
    { new: true, sort: { priority: 1, tokenNumber: 1 } }
  ).lean();

  if (!entry) return null;

  await audit(opdId, (entry as any).tokenNumber, (entry as any).patientId ?? "", (entry as any).patientName ?? "", "waiting", "called", actorId);

  const e = entry as any;
  const { hospitalName, departmentName } = await deptInfo(opdId);
  const room = e.room ?? "";

  // §7, §8: notify called patient + approaching queue
  if (e.patientId) {
    await notify({
      userId: e.patientId,
      templateKey: "QUEUE_TOKEN_CALLED",
      params: { token: e.tokenNumber, department: departmentName, room: room || "—", hospital: hospitalName },
      idempotencyKey: `queue:${e.tokenNumber}:called`,
      hospitalId: e.hospitalId,
      audience: "patient",
      resourceType: "token",
      resourceId: String(e._id ?? e.tokenNumber),
    });
  }

  const ahead = await QueueEntryModel.find({
    opdId,
    status: "waiting",
    ...(sessionId ? { sessionId } : { sessionId: null }),
  })
    .sort({ priority: 1, tokenNumber: 1 })
    .limit(3)
    .select("tokenNumber patientId patientId hospitalId")
    .lean();

  for (let i = 0; i < ahead.length; i++) {
    const a = ahead[i] as any;
    if (!a.patientId) continue;
    await notify({
      userId: a.patientId,
      templateKey: "QUEUE_TOKEN_APPROACHING",
      params: { token: a.tokenNumber, ahead: String(i + 1), department: departmentName },
      idempotencyKey: `queue:${a.tokenNumber}:approaching:${opdId}`,
      hospitalId: a.hospitalId,
      audience: "patient",
      resourceType: "token",
      resourceId: String(a._id ?? a.tokenNumber),
    });
  }

  return plain(entry);
}

export async function startConsultationEntry(tokenNumber: string, opdId = "", actorId = "system") {
  await dbConnect();

  const entry = await QueueEntryModel.findOneAndUpdate(
    { tokenNumber, status: "called" },
    { $set: { status: "in_consultation", updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();

  if (!entry) throw new Error("Token not in 'called' state");
  const e = entry as any;
  await audit(e.opdId ?? opdId, tokenNumber, e.patientId ?? "", e.patientName ?? "", "called", "in_consultation", actorId);
  return plain(entry);
}

export async function completeTokenEntry(tokenNumber: string, opdId = "", actorId = "system") {
  await dbConnect();

  const entry = await QueueEntryModel.findOneAndUpdate(
    { tokenNumber, status: "in_consultation" },
    { $set: { status: "completed", updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();

  if (!entry) throw new Error("Token not in 'in_consultation' state");
  const e = entry as any;
  await audit(e.opdId ?? opdId, tokenNumber, e.patientId ?? "", e.patientName ?? "", "in_consultation", "completed", actorId);
  return plain(entry);
}

export async function skipTokenEntry(tokenNumber: string, opdId = "", actorId = "system", reason = "patient_unavailable") {
  await dbConnect();

  const entry = await QueueEntryModel.findOneAndUpdate(
    { tokenNumber, status: { $in: ["waiting", "called"] } },
    { $set: { status: "skipped", updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();

  if (!entry) throw new Error("Token not in a skippable state");
  const e = entry as any;
  const from = e.status === "skipped" ? "waiting" : "called";
  await audit(e.opdId ?? opdId, tokenNumber, e.patientId ?? "", e.patientName ?? "", from, "skipped", actorId, { reason });
  return plain(entry);
}

export async function recallEntry(tokenNumber: string, opdId = "", actorId = "system") {
  await dbConnect();

  const entry = await QueueEntryModel.findOneAndUpdate(
    { tokenNumber, status: "skipped" },
    { $set: { status: "called", updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();

  if (!entry) throw new Error("Token not in 'skipped' state");
  const e = entry as any;
  await audit(e.opdId ?? opdId, tokenNumber, e.patientId ?? "", e.patientName ?? "", "skipped", "called", actorId);
  return plain(entry);
}

export async function markNoShowEntry(tokenNumber: string, opdId = "", actorId = "system") {
  await dbConnect();

  const entry = await QueueEntryModel.findOneAndUpdate(
    { tokenNumber, status: "called" },
    { $set: { status: "no_show", updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();

  if (!entry) throw new Error("Token not in 'called' state");
  const e = entry as any;
  await audit(e.opdId ?? opdId, tokenNumber, e.patientId ?? "", e.patientName ?? "", "called", "no_show", actorId);
  return plain(entry);
}

export async function markNoShowExpired() {
  await dbConnect();
  const cutoff = new Date(Date.now() - GRACE_PERIOD_MS);
  const expired = await QueueEntryModel.find({ status: "called", updatedAt: { $lt: cutoff.toISOString() } }).lean();
  for (const entry of expired as any[]) {
    await QueueEntryModel.findOneAndUpdate(
      { _id: entry._id, status: "called" },
      { $set: { status: "no_show", updatedAt: new Date().toISOString() } }
    );
    await audit(entry.opdId, entry.tokenNumber, entry.patientId ?? "", entry.patientName ?? "", "called", "no_show", "system", { reason: "grace_period_expired" });
  }
  return expired.length;
}

export async function getHospitalForOpd(opdId: string) {
  await dbConnect();
  const opd = await OpdModel.findOne({ _id: opdId }).lean<{ departmentId: string }>();
  if (!opd) return null;
  const dept = await DepartmentModel.findOne({ _id: opd.departmentId }).lean<{ hospitalId: string }>();
  if (!dept) return null;
  const hosp = await HospitalModel.findOne({ _id: dept.hospitalId }).lean();
  return plain(hosp);
}

export async function getDepartmentForOpd(opdId: string) {
  await dbConnect();
  const opd = await OpdModel.findOne({ _id: opdId }).lean<{ departmentId: string }>();
  if (!opd) return null;
  const dept = await DepartmentModel.findOne({ _id: opd.departmentId }).lean();
  return plain(dept);
}

export async function getDoctorForOpd(opdId: string) {
  await dbConnect();
  const opd = await OpdModel.findOne({ _id: opdId }).lean<{ departmentId: string }>();
  if (!opd) return null;
  const doc = await DoctorModel.findOne({ departmentId: opd.departmentId }).lean();
  return plain(doc);
}

export async function updateOpdStatus(opdId: string, status: string, reason?: string): Promise<void> {
  await dbConnect();
  const update: Record<string, unknown> = { status, statusUpdatedAt: new Date().toISOString() };
  if (status === "paused") update.statusReason = reason;
  await OpdModel.updateOne({ _id: opdId }, { $set: update });

  // §9: delay notification to all waiting patients on this OPD
  if (status === "paused") {
    const waiting = await QueueEntryModel.find({ opdId, status: "waiting" })
      .select("patientId patientId hospitalId tokenNumber")
      .lean();
    const { departmentName } = await deptInfo(opdId);
    const eta = reason?.match(/\d+/)?.[0] ?? "40";
    for (const w of waiting) {
      if (!(w as any).patientId) continue;
      await notify({
        userId: (w as any).patientId,
        templateKey: "QUEUE_DELAYED",
        params: { department: departmentName, eta, token: (w as any).tokenNumber },
        idempotencyKey: `queue:${opdId}:delayed`,
        hospitalId: (w as any).hospitalId,
        audience: "patient",
        resourceType: "opd",
        resourceId: opdId,
      });
    }
  }
}

export async function setPriority(tokenNumber: string, priority: string, actorId = "system") {
  await dbConnect();
  const entry = await QueueEntryModel.findOneAndUpdate(
    { tokenNumber },
    { $set: { priority, overrideAhead: false, updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();
  return plain(entry);
}

export async function setOverrideAhead(tokenNumber: string, overrideAhead: boolean, actorId = "system") {
  await dbConnect();
  const entry = await QueueEntryModel.findOneAndUpdate(
    { tokenNumber },
    { $set: { overrideAhead, updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();
  return plain(entry);
}

export async function listOpdsByHospital(hospitalId: string) {
  await dbConnect();
  const deptDocs = await (DepartmentModel as any).find({ hospitalId }).lean();
  const deptIds = (deptDocs as any[]).map((d: any) => d._id);
  if (!deptIds.length) return [];
  const docs = await (OpdModel as any).find({ departmentId: { $in: deptIds } }).lean();
  return (docs as any[]).map((d: any) => plain(d));
}

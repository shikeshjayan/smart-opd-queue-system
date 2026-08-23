"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { QueueEntryModel, QueueAuditModel, OpdModel, HospitalModel, DepartmentModel, DoctorModel } from "@/lib/models";
import { plain } from "@/lib/models";

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

  const entry = await QueueEntryModel.findOneAndUpdate(
    { opdId, status: "waiting" },
    { $set: { status: "called", updatedAt: new Date().toISOString() } },
    { new: true, sort: { priority: 1, tokenNumber: 1 } }
  ).lean();

  if (!entry) return null;

  await audit(opdId, (entry as any).tokenNumber, (entry as any).patientId ?? "", (entry as any).patientName ?? "", "waiting", "called", actorId);
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

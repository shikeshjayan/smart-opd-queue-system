"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { QueueEntryModel, QueueAuditModel, OpdModel, HospitalModel, DepartmentModel, DoctorModel } from "@/lib/models";
import { plain } from "@/lib/models";

export async function listQueue(opdId: string): Promise<any[]> {
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
  const counts = {
    total: entries.length,
    completed: 0,
    waiting: 0,
    skipped: 0,
    inConsultation: 0,
    cancelled: 0,
  };
  for (const e of entries) {
    if (e.status === "completed") counts.completed++;
    else if (e.status === "waiting") counts.waiting++;
    else if (e.status === "skipped") counts.skipped++;
    else if (e.status === "in_consultation") counts.inConsultation++;
    else if (e.status === "cancelled") counts.cancelled++;
  }
  return counts;
}

export async function orderWaitingEntries(entries: any[]): Promise<any[]> {
  return [...entries].sort((a, b) => {
    const priorityOrder = (p: string) => (p === "emergency" ? 0 : p === "priority" ? 1 : 2);
    if (a.overrideAhead && !b.overrideAhead) return -1;
    if (!a.overrideAhead && b.overrideAhead) return 1;
    const pa = priorityOrder(a.priority);
    const pb = priorityOrder(b.priority);
    if (pa !== pb) return pa - pb;
    return (a.tokenNumber ?? "").localeCompare(b.tokenNumber ?? "");
  });
}

export async function callNextEntry(opdId: string): Promise<any> {
  await dbConnect();
  const waitingDocs = await QueueEntryModel.find({ opdId, status: "waiting" }).lean();
  if (!waitingDocs.length) return undefined;

  const sorted = (waitingDocs as any[]).sort((a: any, b: any) => {
    const priorityOrder = (p: string) => (p === "emergency" ? 0 : p === "priority" ? 1 : 2);
    if (a.overrideAhead && !b.overrideAhead) return -1;
    if (!a.overrideAhead && b.overrideAhead) return 1;
    const pa = priorityOrder(a.priority);
    const pb = priorityOrder(b.priority);
    if (pa !== pb) return pa - pb;
    return (a.tokenNumber ?? "").localeCompare(b.tokenNumber ?? "");
  });

  const nextToken = sorted[0].tokenNumber;

  await QueueEntryModel.updateOne(
    { opdId, tokenNumber: nextToken, status: "waiting" },
    { $set: { status: "called", updatedAt: new Date().toISOString() } }
  );

  await QueueAuditModel.create({
    opdId,
    tokenNumber: nextToken,
    patientId: sorted[0].patientId,
    patientName: sorted[0].patientName,
    fromStatus: "waiting",
    toStatus: "called",
    timestamp: new Date(),
  });

  const updated = await QueueEntryModel.findOne({ opdId, tokenNumber: nextToken }).lean();
  return plain(updated);
}

export async function callTokenEntry(tokenNumber: string): Promise<any> {
  await dbConnect();
  await QueueEntryModel.updateOne(
    { tokenNumber, status: "waiting" },
    { $set: { status: "called", updatedAt: new Date().toISOString() } }
  );
  const doc = await QueueEntryModel.findOne({ tokenNumber }).lean();
  return plain(doc);
}

export async function startConsultationEntry(tokenNumber: string): Promise<any> {
  await dbConnect();
  await QueueEntryModel.updateOne(
    { tokenNumber, status: { $in: ["called", "waiting"] } },
    { $set: { status: "in_consultation", updatedAt: new Date().toISOString() } }
  );
  const doc = await QueueEntryModel.findOne({ tokenNumber }).lean();
  return plain(doc);
}

export async function completeTokenEntry(tokenNumber: string): Promise<any> {
  await dbConnect();
  await QueueEntryModel.updateOne(
    { tokenNumber, status: { $in: ["in_consultation", "called"] } },
    { $set: { status: "completed", updatedAt: new Date().toISOString() } }
  );
  const doc = await QueueEntryModel.findOne({ tokenNumber }).lean();
  return plain(doc);
}

export async function skipTokenEntry(tokenNumber: string): Promise<any> {
  await dbConnect();
  await QueueEntryModel.updateOne(
    { tokenNumber, status: { $in: ["called", "waiting"] } },
    { $set: { status: "skipped", updatedAt: new Date().toISOString() } }
  );
  const doc = await QueueEntryModel.findOne({ tokenNumber }).lean();
  return plain(doc);
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

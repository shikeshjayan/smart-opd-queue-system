"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { QueueEntryModel, OpdModel, HospitalModel, DepartmentModel, DoctorModel, EncounterModel } from "@/lib/models";
import type { QueueEntry, OPD, Hospital, Department, DoctorRecord, OPDCounts } from "@/types";
import { plain, plainList } from "@/lib/models";

export async function listQueue(opdId: string): Promise<QueueEntry[]> {
  await dbConnect();
  const docs = await QueueEntryModel.find({ opdId }).sort({ tokenNumber: 1 }).lean();
  return plainList<QueueEntry>(docs);
}

export async function getOpdById(opdId: string): Promise<OPD | null> {
  await dbConnect();
  const doc = await OpdModel.findOne({ _id: opdId }).lean();
  return plain<OPD>(doc);
}

export async function getQueueCounts(opdId: string): Promise<OPDCounts> {
  await dbConnect();
  const entries = await QueueEntryModel.find({ opdId }).lean<{ status: string }[]>();
  const counts: OPDCounts = {
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

export async function orderWaitingEntries(
  entries: QueueEntry[]
): Promise<QueueEntry[]> {
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

export async function callNextEntry(opdId: string): Promise<QueueEntry | undefined> {
  await dbConnect();
  const waitingDocs = await QueueEntryModel.find({ opdId, status: "waiting" }).lean();
  if (!waitingDocs.length) return undefined;

  const ordered = (
    await orderWaitingEntries(
      (waitingDocs as Array<{ tokenNumber: string; priority: string; overrideAhead: boolean }>).map((d) => ({
        tokenNumber: d.tokenNumber,
        priority: d.priority as "normal" | "priority" | "emergency",
        overrideAhead: d.overrideAhead ?? false,
        status: "waiting" as const,
        isCurrentUser: false,
        patientId: null,
        patientName: null,
      }))
    )
  );
  const nextToken = ordered[0].tokenNumber;

  await QueueEntryModel.updateOne(
    { opdId, tokenNumber: nextToken, status: "waiting" },
    { $set: { status: "called", updatedAt: new Date().toISOString() } }
  );

  const updated = await QueueEntryModel.findOne({ opdId, tokenNumber: nextToken }).lean();
  return plain<QueueEntry>(updated);
}

export async function callTokenEntry(
  tokenNumber: string,
  opdId?: string
): Promise<QueueEntry | undefined> {
  await dbConnect();
  const filter: Record<string, unknown> = { tokenNumber, status: "waiting" };
  if (opdId) filter.opdId = opdId;
  await QueueEntryModel.updateOne(filter, { $set: { status: "called", updatedAt: new Date().toISOString() } });
  const doc = await QueueEntryModel.findOne({ tokenNumber }).lean();
  return plain<QueueEntry>(doc);
}

export async function startConsultationEntry(tokenNumber: string): Promise<QueueEntry | undefined> {
  await dbConnect();
  await QueueEntryModel.updateOne(
    { tokenNumber, status: { $in: ["called", "waiting"] } },
    { $set: { status: "in_consultation", updatedAt: new Date().toISOString() } }
  );
  const doc = await QueueEntryModel.findOne({ tokenNumber }).lean();
  return plain<QueueEntry>(doc);
}

export async function completeTokenEntry(tokenNumber: string): Promise<QueueEntry | undefined> {
  await dbConnect();
  await QueueEntryModel.updateOne(
    { tokenNumber, status: { $in: ["in_consultation", "called"] } },
    { $set: { status: "completed", updatedAt: new Date().toISOString() } }
  );
  const doc = await QueueEntryModel.findOne({ tokenNumber }).lean();
  return plain<QueueEntry>(doc);
}

export async function skipTokenEntry(tokenNumber: string): Promise<QueueEntry | undefined> {
  await dbConnect();
  await QueueEntryModel.updateOne(
    { tokenNumber, status: { $in: ["called", "waiting"] } },
    { $set: { status: "skipped", updatedAt: new Date().toISOString() } }
  );
  const doc = await QueueEntryModel.findOne({ tokenNumber }).lean();
  return plain<QueueEntry>(doc);
}

export async function getHospitalForOpd(opdId: string): Promise<Hospital | null> {
  await dbConnect();
  const opd = await OpdModel.findOne({ _id: opdId }).lean<{ departmentId: string }>();
  if (!opd) return null;
  const dept = await DepartmentModel.findOne({ _id: opd.departmentId }).lean<{ hospitalId: string }>();
  if (!dept) return null;
  const hosp = await HospitalModel.findOne({ _id: dept.hospitalId }).lean();
  return plain<Hospital>(hosp);
}

export async function getDepartmentForOpd(opdId: string): Promise<Department | null> {
  await dbConnect();
  const opd = await OpdModel.findOne({ _id: opdId }).lean<{ departmentId: string }>();
  if (!opd) return null;
  const dept = await DepartmentModel.findOne({ _id: opd.departmentId }).lean();
  return plain<Department>(dept);
}

export async function getDoctorForOpd(opdId: string): Promise<DoctorRecord | null> {
  await dbConnect();
  const opd = await OpdModel.findOne({ _id: opdId }).lean<{ departmentId: string }>();
  if (!opd) return null;
  const doc = await DoctorModel.findOne({ departmentId: opd.departmentId, opdIds: opdId }).lean();
  return plain<DoctorRecord>(doc);
}

export async function updateOpdStatus(
  opdId: string,
  status: string,
  reason?: string
): Promise<void> {
  await dbConnect();
  const update: Record<string, unknown> = {
    status,
    statusUpdatedAt: new Date().toISOString(),
  };
  if (status === "paused") update.statusReason = reason;
  else update.statusReason = undefined;
  await OpdModel.updateOne({ _id: opdId }, { $set: update });
}

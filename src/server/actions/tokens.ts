"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { QueueEntryModel, CounterModel, PatientModel } from "@/lib/models";
import { plain } from "@/lib/models";

const DEPARTMENT_PREFIXES: Record<string, string> = {
  dep_001: "C", dep_002: "G", dep_003: "O", dep_004: "P", dep_005: "D",
  dep_006: "E", dep_007: "G", dep_008: "P", dep_009: "C", dep_010: "E",
  dep_011: "G", dep_012: "P", dep_013: "D", dep_014: "G", dep_015: "P",
  dep_016: "G", dep_017: "O"
};

export async function generateToken({
  opdId,
  patientId,
  patientName,
  hospitalId,
  departmentId,
  priority = "normal",
  source = "walk_in",
  appointmentId
}: {
  opdId: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  departmentId: string;
  priority?: string;
  source?: string;
  appointmentId?: string;
}) {
  await dbConnect();

  const prefix = DEPARTMENT_PREFIXES[departmentId] || "T";
  const date = new Date().toISOString().split("T")[0];
  const counterKey = `token:${opdId}:${date}`;

  const doc = await CounterModel.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean<{ seq: number }>();

  const seq = doc?.seq ?? 1;
  const tokenNumber = `${prefix}-${String(seq).padStart(3, "0")}`;

  const entry = await (QueueEntryModel as any).create({
    _id: `qe_${tokenNumber}_${date}`,
    opdId,
    tokenNumber,
    patientId,
    patientName,
    status: "waiting",
    priority,
    overrideAhead: false,
    isCurrentUser: false,
    position: seq,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    metadata: { source, appointmentId }
  });

  return plain(entry);
}

export async function getActiveToken(patientId: string) {
  await dbConnect();
  const entry = await QueueEntryModel.findOne({
    patientId,
    status: { $in: ["waiting", "called", "in_consultation"] }
  }).lean();
  return plain(entry);
}

export async function cancelToken(tokenNumber: string, reason: string = "patient_request") {
  await dbConnect();
  const entry = await QueueEntryModel.findOneAndUpdate(
    { tokenNumber, status: { $in: ["waiting", "called"] } },
    { $set: { status: "cancelled", updatedAt: new Date().toISOString(), metadata: { reason } } },
    { new: true }
  ).lean();
  
  if (!entry) throw new Error("Token not found or cannot be cancelled");
  return plain(entry);
}

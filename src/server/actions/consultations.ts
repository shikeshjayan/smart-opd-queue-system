"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { ConsultationModel, EncounterModel, PrescriptionModel } from "@/lib/models";
import { plain } from "@/lib/models";

export async function getConsultation(encounterId: string): Promise<Record<string, unknown> | null> {
  await dbConnect();
  const doc = await ConsultationModel.findOne({ encounterId }).lean();
  return plain(doc);
}

export async function saveConsultation(
  encounterId: string,
  data: Record<string, unknown>
): Promise<void> {
  await dbConnect();
  await ConsultationModel.updateOne(
    { encounterId },
    { $set: { ...data, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

export async function finalizeConsultation(encounterId: string): Promise<void> {
  await dbConnect();
  const now = new Date().toISOString();
  await ConsultationModel.updateOne(
    { encounterId },
    { $set: { finalizedAt: now, updatedAt: now } }
  );
  await EncounterModel.updateOne(
    { _id: encounterId },
    { $set: { status: "completed", completedAt: now, updatedAt: now } }
  );
}

export async function listPatientPrescriptions(patientId: string): Promise<Record<string, unknown>[]> {
  await dbConnect();
  const docs = await PrescriptionModel.find({ patientId, workflowStatus: "finalized" })
    .sort({ finalizedAt: -1 })
    .lean();
  return docs.map((d) => plain(d)!);
}

export async function getPrescription(id: string): Promise<Record<string, unknown> | null> {
  await dbConnect();
  const doc = await PrescriptionModel.findOne({ _id: id }).lean();
  return plain(doc);
}

export async function listActivePrescriptions(patientId: string): Promise<Record<string, unknown>[]> {
  await dbConnect();
  const docs = await PrescriptionModel.find({ patientId, workflowStatus: "finalized" })
    .sort({ finalizedAt: -1 })
    .lean();
  return docs.map((d) => plain(d)!);
}

"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { ConsultationModel, ConsultationAuditModel, EncounterModel, PatientModel, DoctorModel, QueueEntryModel, QueueAuditModel } from "@/lib/models";
import { plain } from "@/lib/models";
import type { ConsultationSections } from "@/services/consultation/types";
import { notify } from "@/server/notifications/service";

async function getActor(): Promise<{ id: string; name: string }> {
  try {
    const { getSession } = await import("@/lib/auth");
    const user = await getSession();
    if (user) return { id: user.id, name: user.name };
  } catch {}
  return { id: "system", name: "System" };
}

async function audit(encounterId: string, action: string, detail: Record<string, unknown> = {}) {
  const actor = await getActor();
  await ConsultationAuditModel.create({
    encounterId,
    actorId: actor.id,
    actorName: actor.name,
    action,
    timestamp: new Date(),
    detail,
  });
}

export async function getConsultationRecord(encounterId: string) {
  await dbConnect();
  const doc = await ConsultationModel.findOne({ encounterId }).lean();
  return plain(doc);
}

export async function getConsultationContext(encounterId: string) {
  await dbConnect();
  const encDoc = await EncounterModel.findOne({ _id: encounterId }).lean<any>();
  if (!encDoc) return null;
  const { plainList } = await import("@/lib/models");
  const encounter = plain<any>(encDoc);
  const patDoc = await PatientModel.findOne({ _id: encDoc.patientId }).lean<any>();
  const patient = patDoc ? plain<any>(patDoc) : null;
  const recDoc = await ConsultationModel.findOne({ encounterId }).lean<any>();
  const record = recDoc
    ? { ...plain<any>(recDoc), encounterId }
    : {
        encounterId,
        chiefComplaint: { text: "" },
        symptoms: [],
        vitals: {},
        examination: {},
        diagnoses: [],
        treatmentPlan: "",
        followUp: { decision: "none" },
        version: 1,
        status: "draft",
      };
  void plainList;
  return { encounter, patient, record };
}

export async function getActiveEncounterForPatient(patientId: string) {
  await dbConnect();
  const encDoc = await EncounterModel.findOne({
    patientId,
    status: { $in: ["open", "in_progress"] },
  })
    .sort({ createdAt: -1 })
    .lean<any>();
  if (!encDoc) return null;
  const encounter = plain<any>(encDoc);
  const patDoc = await PatientModel.findOne({ _id: patientId }).lean<any>();
  const patient = patDoc ? plain<any>(patDoc) : null;
  const recDoc = await ConsultationModel.findOne({ encounterId: encDoc._id }).lean<any>();
  const record = recDoc
    ? { ...plain<any>(recDoc), encounterId: String(encDoc._id) }
    : {
        encounterId: String(encDoc._id),
        chiefComplaint: { text: "" },
        symptoms: [],
        vitals: {},
        examination: {},
        diagnoses: [],
        treatmentPlan: "",
        followUp: { decision: "none" },
        version: 1,
        status: "draft",
      };
  return { encounter, patient, record };
}

export async function saveConsultationDraft(
  encounterId: string,
  sections: ConsultationSections,
  expectedVersion?: number,
): Promise<{ ok: boolean; version: number; conflict?: boolean }> {
  await dbConnect();

  const existing = await ConsultationModel.findOne({ encounterId }).lean<{
    version: number; status: string; lockedBy?: string | null;
  }>();

  if (existing?.status === "completed") {
    throw new Error("Encounter is finalized. Use requestCorrection to amend.");
  }

  const filter: Record<string, unknown> = { encounterId };
  if (typeof expectedVersion === "number" && existing) {
    filter.version = expectedVersion;
  }

  try {
    const doc = await ConsultationModel.findOneAndUpdate(
      filter,
      {
        $set: { ...sections, updatedAt: new Date().toISOString(), status: "draft" },
        $inc: { version: 1 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    await audit(encounterId, "draft_saved");
    return { ok: true, version: (doc as any)?.version ?? 1 };
  } catch {
    const latest = await ConsultationModel.findOne({ encounterId }).lean<{ version: number }>();
    await audit(encounterId, "save_conflict");
    return { ok: false, version: (latest as any)?.version ?? 0, conflict: true };
  }
}

export async function acquireLock(encounterId: string): Promise<boolean> {
  await dbConnect();
  const actor = await getActor();
  const result = await ConsultationModel.findOneAndUpdate(
    {
      encounterId,
      $or: [
        { lockedBy: { $in: [null, undefined, ""] } },
        { lockedBy: actor.id },
        { lockedAt: { $lt: new Date(Date.now() - 10 * 60 * 1000).toISOString() } },
      ],
    },
    { $set: { lockedBy: actor.id, lockedAt: new Date().toISOString() } },
    { upsert: true, new: true }
  ).lean();
  return !!result;
}

export async function releaseLock(encounterId: string): Promise<void> {
  await dbConnect();
  const actor = await getActor();
  await ConsultationModel.updateOne(
    { encounterId, lockedBy: actor.id },
    { $set: { lockedBy: null, lockedAt: null } }
  );
}

export async function completeConsultation(
  encounterId: string,
  sections: ConsultationSections,
  expectedVersion?: number,
): Promise<{ ok: boolean; error?: string }> {
  await dbConnect();

  const errors: string[] = [];
  if (!sections.diagnoses.some((d) => d.type === "primary")) errors.push("A primary diagnosis is required.");
  if (!sections.chiefComplaint.text.trim()) errors.push("Chief complaint is required.");
  if (!sections.treatmentPlan.trim()) errors.push("Treatment plan is required.");
  if (errors.length > 0) return { ok: false, error: errors.join(" ") };

  const existing = await ConsultationModel.findOne({ encounterId }).lean<{ version: number; status: string }>();
  if (existing?.status === "completed") return { ok: false, error: "Already finalized." };

  const filter: Record<string, unknown> = { encounterId, status: { $ne: "completed" } };
  if (typeof expectedVersion === "number" && existing) {
    filter.version = expectedVersion;
  }

  try {
    const doc = await ConsultationModel.findOneAndUpdate(
      filter,
      {
        $set: {
          ...sections,
          status: "completed",
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lockedBy: null,
          lockedAt: null,
        },
        $inc: { version: 1 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    if (!doc) return { ok: false, error: "Version conflict. Please refresh." };

    // Mark encounter completed
    await EncounterModel.updateOne(
      { _id: encounterId },
      { $set: { status: "completed", completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }
    );

    // §7: follow-up notification
    if (sections.followUp && sections.followUp.decision !== "none" && "date" in sections.followUp) {
      const fup = sections.followUp as { decision: string; date?: string; departmentId?: string; notes?: string };
        if (fup.date) {
          const encounter = await EncounterModel.findById(encounterId).lean();
          const patientId = (encounter as any)?.patientId;
          if (patientId) {
            const doctor = await DoctorModel?.findById((encounter as any)?.doctorId).select("name").lean().catch(() => null);
          await notify({
            userId: patientId,
            templateKey: "FOLLOW_UP_SCHEDULED",
            params: { doctor: doctor?.name ?? "your doctor", date: fup.date },
            idempotencyKey: `followup:${encounterId}:${fup.date}`,
            hospitalId: (encounter as any)?.hospitalId,
            audience: "patient",
            resourceType: "followUp",
            resourceId: encounterId,
          });
        }
      }
    }

    // Complete any active queue entry for this encounter
    const enc = await EncounterModel.findOne({ _id: encounterId }).lean<{ tokenId: string; opdId: string; doctorId: string; tokenNumber: string; patientId: string }>();
    if (enc) {
      const entry = await QueueEntryModel.findOneAndUpdate(
        { opdId: enc.opdId, tokenNumber: enc.tokenNumber, status: "in_consultation" },
        { $set: { status: "completed", updatedAt: new Date().toISOString() } },
        { new: true }
      ).lean();
      if (entry) {
        await QueueAuditModel.create({
          opdId: enc.opdId,
          tokenNumber: enc.tokenNumber,
          patientId: (entry as any).patientId ?? "",
          patientName: (entry as any).patientName ?? "",
          fromStatus: "in_consultation",
          toStatus: "completed",
          actorId: enc.doctorId,
          timestamp: new Date(),
        });
      }
    }

    await audit(encounterId, "finalized");
    return { ok: true };
  } catch {
    return { ok: false, error: "Version conflict. Please refresh and try again." };
  }
}

export async function requestCorrection(
  encounterId: string,
  reason: string,
): Promise<{ ok: boolean }> {
  await dbConnect();
  const original = await ConsultationModel.findOne({ encounterId, status: "completed" }).lean();
  if (!original) throw new Error("No finalized consultation found.");

  await ConsultationModel.findOneAndUpdate(
    { encounterId },
    { $set: { status: "draft", amendedFrom: (original as any)._id, updatedAt: new Date().toISOString() }, $inc: { version: 1 } },
    { new: true }
  ).lean();

  await EncounterModel.updateOne(
    { _id: encounterId },
    { $set: { status: "open", updatedAt: new Date().toISOString() } }
  );

  await audit(encounterId, "correction_requested", { reason, amendedFrom: (original as any)._id });
  return { ok: true };
}

export async function listConsultationAudit(encounterId: string) {
  await dbConnect();
  const docs = await ConsultationAuditModel.find({ encounterId }).sort({ timestamp: 1 }).lean();
  return (docs as any[]).map(d => plain(d));
}

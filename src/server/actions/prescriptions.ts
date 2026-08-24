"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { PrescriptionModel, PrescriptionAuditModel } from "@/lib/models";
import { plain } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { durationToDays } from "@/services/prescription/types";
import type {
  Duration,
  MedicationRegimenEntry,
  Prescription,
  PrescriptionContextRef,
  PrescriptionDraftItem,
  PrescribedMedicine,
} from "@/services/prescription/types";

/* ---------- helpers ---------- */

type RxDoc = Record<string, unknown> & { _id?: string };

function buildMedicine(item: PrescriptionDraftItem): PrescribedMedicine {
  const durationDays = durationToDays(item.duration as Duration);
  return {
    id: `pmi_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    medicineId: item.medicineId,
    medicineName: item.medicineName,
    genericName: item.genericName ?? item.medicineName,
    brandLabel: item.brandLabel,
    dosage: item.dosage,
    frequency: item.frequency,
    duration: item.duration as Duration,
    durationDays,
    route: item.route,
    instructions: item.instructions,
    status: "prescribed",
  };
}

function normalize(doc: RxDoc | null): Prescription | null {
  if (!doc) return null;
  const d = doc as any;
  return {
    id: String(d._id),
    encounterId: d.encounterId ?? "",
    patientId: d.patientId ?? "",
    doctorId: d.doctorId ?? "",
    hospitalId: d.hospitalId ?? "",
    issuedAt: d.issuedAt ?? d.createdAt ?? new Date().toISOString(),
    createdAt: d.createdAt ?? new Date().toISOString(),
    finalizedAt: d.finalizedAt,
    hospitalName: d.hospitalName ?? "",
    departmentName: d.departmentName ?? "",
    doctorName: d.doctorName ?? "",
    medicines: (d.medicines ?? d.items ?? []) as PrescribedMedicine[],
    instructions: d.instructions,
    workflowStatus: d.workflowStatus ?? "draft",
    status: d.status ?? "pending",
    printedAt: d.printedAt,
    cancelledReason: d.cancelledReason,
  };
}

async function audit(prescriptionId: string, action: string, detail: Record<string, unknown> = {}) {
  const session = await getSession();
  await PrescriptionAuditModel.create({
    prescriptionId,
    action,
    actorId: session?.id,
    detail,
    createdAt: new Date().toISOString(),
  });
}

/* ---------- queries ---------- */

export async function listForEncounter(encounterId: string): Promise<Prescription[]> {
  await dbConnect();
  const docs = await PrescriptionModel.find({ encounterId })
    .sort({ createdAt: -1 })
    .lean<RxDoc[]>();
  return (docs as any[]).map((d) => normalize(d)!).filter(Boolean);
}

export async function listForPatient(patientId: string): Promise<Prescription[]> {
  await dbConnect();
  const docs = await PrescriptionModel.find({ patientId })
    .sort({ createdAt: -1 })
    .lean<RxDoc[]>();
  return (docs as any[]).map((d) => normalize(d)!).filter(Boolean);
}

export async function getById(prescriptionId: string): Promise<Prescription | undefined> {
  await dbConnect();
  const doc = await PrescriptionModel.findOne({ _id: prescriptionId }).lean<RxDoc | null>();
  return normalize(doc) ?? undefined;
}

export async function getDraftForEncounter(encounterId: string): Promise<Prescription | undefined> {
  await dbConnect();
  const doc = await PrescriptionModel.findOne({ encounterId, workflowStatus: "draft" }).lean<RxDoc | null>();
  return normalize(doc) ?? undefined;
}

export async function listRegimen(patientId: string): Promise<MedicationRegimenEntry[]> {
  await dbConnect();
  const docs = await PrescriptionModel.find({
    patientId,
    workflowStatus: { $in: ["finalized", "draft"] },
  })
    .sort({ createdAt: -1 })
    .lean<RxDoc[]>();

  const entries: MedicationRegimenEntry[] = [];
  for (const doc of docs as any[]) {
    for (const med of (doc.medicines ?? []) as PrescribedMedicine[]) {
      if (med.status === "cancelled") continue;
      entries.push({
        id: med.id,
        patientId,
        medicineId: med.medicineId,
        genericName: med.genericName,
        brandLabel: med.brandLabel,
        dosage: med.dosage,
        frequency: med.frequency,
        startedAt: doc.createdAt ?? new Date().toISOString(),
        durationDays: med.durationDays,
        expectedEndDate: undefined,
        status:
          med.status === "discontinued"
            ? "discontinued"
            : med.durationDays !== undefined
              ? "active"
              : "active",
        discontinuedAt: med.status === "discontinued" ? doc.updatedAt : undefined,
        reason: med.discontinuedReason,
      });
    }
  }
  return entries;
}

/* ---------- mutations ---------- */

export async function createDraft(
  encounterId: string,
  ref: PrescriptionContextRef,
  items: PrescriptionDraftItem[],
  instructions?: string
): Promise<Prescription> {
  await dbConnect();
  const now = new Date().toISOString();
  const doc = await PrescriptionModel.create({
    _id: `RX${Date.now()}`,
    encounterId,
    ...ref,
    issuedAt: now,
    createdAt: now,
    medicines: items.map(buildMedicine),
    instructions,
    workflowStatus: "draft",
    status: "pending",
  });
  await audit(String(doc._id), "rx_draft_created");
  return normalize(doc.toObject())!;
}

export async function updateDraft(
  prescriptionId: string,
  items: PrescriptionDraftItem[],
  instructions?: string
): Promise<Prescription | undefined> {
  await dbConnect();
  const now = new Date().toISOString();
  const doc = await PrescriptionModel.findOneAndUpdate(
    { _id: prescriptionId, workflowStatus: "draft" },
    {
      $set: {
        medicines: items.map(buildMedicine),
        instructions,
        issuedAt: now,
        updatedAt: now,
      },
    },
    { new: true }
  ).lean<RxDoc | null>();
  if (doc) await audit(prescriptionId, "rx_draft_updated");
  return normalize(doc) ?? undefined;
}

export async function finalizePrescription(prescriptionId: string): Promise<Prescription | undefined> {
  await dbConnect();
  const now = new Date().toISOString();
  const doc = await PrescriptionModel.findOneAndUpdate(
    { _id: prescriptionId, workflowStatus: "draft" },
    { $set: { workflowStatus: "finalized", finalizedAt: now, updatedAt: now } },
    { new: true }
  ).lean<RxDoc | null>();
  if (doc) {
    await audit(prescriptionId, "rx_finalized");
    // discontinue active regimen duplicates? keep simple: no-op
  }
  return normalize(doc) ?? undefined;
}

export async function cancelPrescription(
  prescriptionId: string,
  reason?: string
): Promise<Prescription | undefined> {
  await dbConnect();
  const now = new Date().toISOString();
  const doc = await PrescriptionModel.findOneAndUpdate(
    { _id: prescriptionId, workflowStatus: { $in: ["draft", "finalized"] } },
    {
      $set: {
        workflowStatus: "cancelled",
        status: "cancelled",
        cancelledReason: reason,
        updatedAt: now,
      },
    },
    { new: true }
  ).lean<RxDoc | null>();
  if (doc) await audit(prescriptionId, "rx_cancelled", { reason });
  return normalize(doc) ?? undefined;
}

export async function updateDispenseStatus(
  prescriptionId: string,
  status: Prescription["status"]
): Promise<Prescription | undefined> {
  await dbConnect();
  const now = new Date().toISOString();

  const set: Record<string, unknown> = { status, updatedAt: now };
  if (status === "dispensed") {
    set["medicines.$[].dispensedAt"] = now;
    set["medicines.$[].status"] = "dispensed";
  }

  const doc = await PrescriptionModel.findOneAndUpdate(
    {
      _id: prescriptionId,
      workflowStatus: "finalized",
      status: { $in: status === "sent_to_pharmacy" ? ["pending", "sent_to_pharmacy"] : ["sent_to_pharmacy", "pending"] },
    },
    { $set: set },
    { new: true }
  ).lean<RxDoc | null>();
  if (doc) await audit(prescriptionId, "rx_status_updated", { status });
  return normalize(doc) ?? undefined;
}

export async function discontinueRegimen(
  regimenId: string,
  reason: string
): Promise<Prescription | undefined> {
  await dbConnect();
  const now = new Date().toISOString();
  const doc = await PrescriptionModel.findOneAndUpdate(
    { "medicines.id": regimenId },
    {
      $set: {
        "medicines.$.status": "discontinued",
        "medicines.$.discontinuedReason": reason,
        updatedAt: now,
      },
    },
    { new: true }
  ).lean<RxDoc | null>();
  if (doc) await audit(String(doc._id), "regimen_discontinued", { regimenId, reason });
  return normalize(doc) ?? undefined;
}

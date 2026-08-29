"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  PatientModel,
  EncounterModel,
  AllergyModel,
  ConditionModel,
  VitalSignsModel,
  PrescriptionModel,
  DiagnosticOrderModel,
  DiagnosticResultModel,
  DocumentMetaModel,
  BreakGlassRequestModel,
  CorrectionRequestModel,
  ConsultationModel,
  nextSequence,
  plain,
  plainList,
} from "@/lib/models";
import type { AccessContext } from "@/server/lib/access-context";
import { assertPatientAccess, assertHospitalAccess, assertAnyDistrictAccess } from "@/server/lib/scope-access";
import type {
  Patient,
  Allergy,
  Condition,
  VitalSigns,
  Encounter,
  BreakGlassRequest,
  CorrectionRequest,
  EncounterType,
} from "@/types";
import type { DiagnosticOrder, DiagnosticResult } from "@/services/diagnostics/types";
import type { MedicalDocument } from "@/services/medical-documents/types";

/* ---------- Cursor pagination helper (WS 28.7) ---------- */

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export async function cursorPaginate<T>(
  model: any,
  filter: Record<string, unknown>,
  opts: { limit: number; cursor?: string | null; sortKey?: string },
  sortDir: 1 | -1 = -1
): Promise<CursorPage<T>> {
  const limit = Math.min(Math.max(opts.limit, 1), 50);
  const sortKey = opts.sortKey ?? "createdAt";

  const baseFilter: Record<string, unknown> = { ...filter };
  if (opts.cursor) {
    baseFilter[sortKey] = sortDir === -1 ? { $lt: opts.cursor } : { $gt: opts.cursor };
  }

  const docs = await model
    .find(baseFilter)
    .sort({ [sortKey]: sortDir })
    .limit(limit + 1)
    .lean();

  const hasMore = docs.length > limit;
  const pageDocs = docs.slice(0, limit);
  const last = pageDocs[pageDocs.length - 1];

  return {
    items: plainList<T>(pageDocs),
    nextCursor: last ? String(last[sortKey] ?? "") : null,
    hasMore,
  };
}

/* ---------- Patient ---------- */

export const PATIENT_NUMBER_PREFIX = "KL-GH";

export async function generatePatientNumber(): Promise<string> {
  const seq = await nextSequence("patient_number");
  return `${PATIENT_NUMBER_PREFIX}-${String(seq).padStart(9, "0")}`;
}

export class PatientRepository {
  async findById(patientId: string, ctx: AccessContext): Promise<Patient | null> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const doc = await PatientModel.findById(patientId).lean();
    return plain<Patient>(doc);
  }

  async findByPatientNumber(patientNumber: string, ctx: AccessContext): Promise<Patient | null> {
    await dbConnect();
    const doc = await PatientModel.findOne({ patientNumber }).lean();
    if (!doc) return null;
    assertPatientAccess(ctx, String(doc._id));
    return plain<Patient>(doc);
  }

  async create(data: {
    identity: Patient["identity"];
    contact: Patient["contact"];
    address?: Patient["address"];
    emergencyContact?: Patient["emergencyContact"];
    bloodGroup?: string;
    registeredHospitalId: string;
    knownInfo?: Patient["knownInfo"];
  }, ctx: AccessContext): Promise<Patient> {
    await dbConnect();
    assertHospitalAccess(ctx, data.registeredHospitalId);
    const now = new Date().toISOString();
    const patientNumber = await generatePatientNumber();
    const id = `pat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const doc = await PatientModel.create({
      _id: id,
      patientNumber,
      identity: data.identity,
      contact: data.contact,
      address: data.address,
      emergencyContact: data.emergencyContact,
      bloodGroup: data.bloodGroup,
      registeredHospitalId: data.registeredHospitalId,
      knownInfo: data.knownInfo ?? { allergies: [], medications: [], conditions: [] },
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return plain<Patient>(doc);
  }

  async update(patientId: string, patch: Partial<Patient>, ctx: AccessContext): Promise<Patient | null> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const doc = await PatientModel.findByIdAndUpdate(
      patientId,
      { $set: { ...patch, updatedAt: new Date().toISOString() } },
      { new: true }
    ).lean();
    return plain<Patient>(doc);
  }

  async searchPatients(query: string, ctx: AccessContext): Promise<Patient[]> {
    await dbConnect();
    assertAnyDistrictAccess(ctx);
    const term = query.trim();
    if (!term) return [];

    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const docs = await PatientModel.find({
      $or: [
        { patientNumber: regex },
        { "identity.name": regex },
        { "contact.mobile": regex },
      ],
    })
      .sort({ "identity.name": 1 })
      .limit(25)
      .lean();

    return plainList<Patient>(docs);
  }

  async findByContactMobile(mobile: string, ctx: AccessContext): Promise<Patient | null> {
    await dbConnect();
    const doc = await PatientModel.findOne({ "contact.mobile": mobile }).lean();
    if (!doc) return null;
    assertPatientAccess(ctx, String(doc._id));
    return plain<Patient>(doc);
  }
}

export const patientRepository = new PatientRepository();

/* ---------- Encounter ---------- */

export class EncounterRepository {
  async findById(encounterId: string, ctx: AccessContext): Promise<Encounter | null> {
    await dbConnect();
    const doc = await EncounterModel.findById(encounterId).lean();
    if (!doc) return null;
    assertPatientAccess(ctx, String(doc.patientId));
    return plain<Encounter>(doc);
  }

  async findByPatient(patientId: string, ctx: AccessContext): Promise<Encounter[]> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const docs = await EncounterModel.find({ patientId }).sort({ date: -1 }).limit(100).lean();
    return plainList<Encounter>(docs);
  }

  async findByHospital(hospitalId: string, ctx: AccessContext): Promise<Encounter[]> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const docs = await EncounterModel.find({ hospitalId }).sort({ date: -1 }).limit(50).lean();
    return plainList<Encounter>(docs);
  }

  async create(data: {
    patientId: string;
    hospitalId: string;
    departmentId?: string;
    doctorId?: string;
    appointmentId?: string;
    opdSessionId?: string;
    opdId?: string;
    tokenId?: string;
    tokenNumber?: string;
    type: EncounterType;
    hospitalName?: string;
    departmentName?: string;
    doctorName?: string;
  }, ctx: AccessContext): Promise<Encounter> {
    await dbConnect();
    assertPatientAccess(ctx, data.patientId);
    assertHospitalAccess(ctx, data.hospitalId);
    const now = new Date().toISOString();
    const id = `enc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const date = now.slice(0, 10);

    const doc = await EncounterModel.create({
      _id: id,
      patientId: data.patientId,
      hospitalId: data.hospitalId,
      departmentId: data.departmentId,
      doctorId: data.doctorId,
      appointmentId: data.appointmentId,
      opdSessionId: data.opdSessionId,
      opdId: data.opdId,
      tokenId: data.tokenId,
      tokenNumber: data.tokenNumber,
      type: data.type,
      status: "planned",
      date,
      hospitalName: data.hospitalName,
      departmentName: data.departmentName,
      doctorName: data.doctorName,
      createdAt: now,
      updatedAt: now,
    });

    return plain<Encounter>(doc);
  }

  async updateStatus(encounterId: string, status: Encounter["status"], ctx: AccessContext): Promise<Encounter | null> {
    await dbConnect();
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status, updatedAt: now };
    if (status === "in_progress") patch.startedAt = now;
    if (status === "completed") patch.completedAt = now;

    const doc = await EncounterModel.findByIdAndUpdate(
      encounterId,
      { $set: patch },
      { new: true }
    ).lean();
    if (!doc) return null;
    assertPatientAccess(ctx, String(doc.patientId));
    return plain<Encounter>(doc);
  }
}

export const encounterRepository = new EncounterRepository();

/* ---------- Allergy ---------- */

export class AllergyRepository {
  async findByPatient(patientId: string, ctx: AccessContext): Promise<Allergy[]> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const docs = await AllergyModel.find({ patientId }).sort({ recordedAt: -1 }).lean();
    return plainList<Allergy>(docs);
  }

  async findBySubstance(patientId: string, substance: string, ctx: AccessContext): Promise<Allergy | null> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const doc = await AllergyModel.findOne({ patientId, substance }).lean();
    return plain<Allergy>(doc);
  }

  async create(data: {
    patientId: string;
    substance: string;
    reaction?: string;
    severity?: Allergy["severity"];
    status?: Allergy["status"];
    recordedBy: string;
  }, ctx: AccessContext): Promise<Allergy> {
    await dbConnect();
    assertPatientAccess(ctx, data.patientId);
    const id = `all_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const doc = await AllergyModel.create({
      _id: id,
      patientId: data.patientId,
      substance: data.substance,
      reaction: data.reaction ?? "",
      severity: data.severity,
      status: data.status ?? "active",
      recordedAt: new Date().toISOString(),
      recordedBy: data.recordedBy,
    });

    return plain<Allergy>(doc);
  }

  async update(patientId: string, allergyId: string, patch: Partial<Allergy>, ctx: AccessContext): Promise<Allergy | null> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const doc = await AllergyModel.findOneAndUpdate(
      { _id: allergyId, patientId },
      { $set: patch },
      { new: true }
    ).lean();
    return plain<Allergy>(doc);
  }

  async remove(patientId: string, allergyId: string, ctx: AccessContext): Promise<void> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    await AllergyModel.deleteOne({ _id: allergyId, patientId });
  }
}

export const allergyRepository = new AllergyRepository();

/* ---------- Condition ---------- */

export class ConditionRepository {
  async findByPatient(patientId: string, ctx: AccessContext): Promise<Condition[]> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const docs = await ConditionModel.find({ patientId }).sort({ createdAt: -1 }).lean();
    return plainList<Condition>(docs);
  }

  async findActive(patientId: string, ctx: AccessContext): Promise<Condition[]> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const docs = await ConditionModel.find({ patientId, status: "active" }).sort({ createdAt: -1 }).lean();
    return plainList<Condition>(docs);
  }

  async create(data: {
    patientId: string;
    name: string;
    status?: Condition["status"];
    diagnosedAt?: string;
    recordedBy: string;
  }, ctx: AccessContext): Promise<Condition> {
    await dbConnect();
    assertPatientAccess(ctx, data.patientId);
    const id = `con_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const doc = await ConditionModel.create({
      _id: id,
      patientId: data.patientId,
      name: data.name,
      status: data.status ?? "active",
      diagnosedAt: data.diagnosedAt ?? new Date().toISOString().slice(0, 10),
      recordedBy: data.recordedBy,
      createdAt: new Date().toISOString(),
    });

    return plain<Condition>(doc);
  }

  async updateStatus(patientId: string, conditionId: string, status: Condition["status"], ctx: AccessContext): Promise<Condition | null> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const doc = await ConditionModel.findOneAndUpdate(
      { _id: conditionId, patientId },
      { $set: { status } },
      { new: true }
    ).lean();
    return plain<Condition>(doc);
  }

  async update(patientId: string, conditionId: string, patch: Partial<Condition>, ctx: AccessContext): Promise<Condition | null> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const doc = await ConditionModel.findOneAndUpdate(
      { _id: conditionId, patientId },
      { $set: patch },
      { new: true }
    ).lean();
    return plain<Condition>(doc);
  }
}

export const conditionRepository = new ConditionRepository();

/* ---------- Vital Signs ---------- */

export class VitalSignsRepository {
  async findByPatient(patientId: string, ctx: AccessContext, limit = 50): Promise<VitalSigns[]> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const docs = await VitalSignsModel.find({ patientId }).sort({ recordedAt: -1 }).limit(limit).lean();
    return plainList<VitalSigns>(docs);
  }

   async findByEncounter(encounterId: string, ctx: AccessContext): Promise<VitalSigns[]> {
    await dbConnect();
    const docs = await VitalSignsModel.find({ encounterId }).sort({ recordedAt: -1 }).lean();
    if (docs.length && docs[0]) assertPatientAccess(ctx, String((docs[0] as unknown as VitalSigns).patientId));
    return plainList<VitalSigns>(docs);
  }


  async findLatest(patientId: string, ctx: AccessContext): Promise<VitalSigns | null> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const doc = await VitalSignsModel.findOne({ patientId }).sort({ recordedAt: -1 }).lean();
    return plain<VitalSigns>(doc);
  }

  async create(data: {
    patientId: string;
    encounterId?: string;
    temperature?: number;
    heartRate?: number;
    respiratoryRate?: number;
    systolicBP?: number;
    diastolicBP?: number;
    oxygenSaturation?: number;
    heightCm?: number;
    weightKg?: number;
    recordedBy: string;
  }, ctx: AccessContext): Promise<VitalSigns> {
    await dbConnect();
    assertPatientAccess(ctx, data.patientId);
    const id = `vit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const doc = await VitalSignsModel.create({
      _id: id,
      patientId: data.patientId,
      encounterId: data.encounterId ?? null,
      temperature: data.temperature,
      heartRate: data.heartRate,
      respiratoryRate: data.respiratoryRate,
      systolicBP: data.systolicBP,
      diastolicBP: data.diastolicBP,
      oxygenSaturation: data.oxygenSaturation,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      recordedAt: new Date().toISOString(),
      recordedBy: data.recordedBy,
    });

    return plain<VitalSigns>(doc);
  }
}

export const vitalSignsRepository = new VitalSignsRepository();

/* ---------- Prescription (read + create) ---------- */

export type MedicalPrescription = {
  id: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  hospitalId: string;
  items: Array<{
    medicineName: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    route?: string;
    instructions?: string;
  }>;
  instructions?: string;
  workflowStatus: string;
  status: string;
  dispensedItems?: unknown[];
  activity?: unknown[];
  createdAt: string;
  finalizedAt?: string;
  updatedAt: string;
};

export class PrescriptionRepository {
  async findByEncounter(encounterId: string, ctx: AccessContext): Promise<MedicalPrescription[]> {
    await dbConnect();
    const docs = await PrescriptionModel.find({ encounterId }).sort({ createdAt: -1 }).lean();
    if (docs.length && docs[0]) assertPatientAccess(ctx, String((docs[0] as unknown as MedicalPrescription).patientId));
    return plainList<MedicalPrescription>(docs);
  }

  async findByPatient(patientId: string, ctx: AccessContext, limit = 50): Promise<MedicalPrescription[]> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const docs = await PrescriptionModel.find({ patientId }).sort({ createdAt: -1 }).limit(limit).lean();
    return plainList<MedicalPrescription>(docs);
  }

  async findById(prescriptionId: string, ctx: AccessContext): Promise<MedicalPrescription | null> {
    await dbConnect();
    const doc = await PrescriptionModel.findById(prescriptionId).lean();
    if (doc) assertPatientAccess(ctx, String((doc as unknown as { patientId?: unknown }).patientId));
    return plain<MedicalPrescription>(doc);
  }

  async create(data: {
    encounterId: string;
    patientId: string;
    doctorId: string;
    hospitalId: string;
    items: Array<{
      medicineName: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      route?: string;
      instructions?: string;
    }>;
    status?: string;
    workflowStatus?: string;
  }, ctx: AccessContext): Promise<MedicalPrescription> {
    await dbConnect();
    assertPatientAccess(ctx, data.patientId);
    assertHospitalAccess(ctx, data.hospitalId);

    const now = new Date().toISOString();

    const doc = await PrescriptionModel.create({
      _id: `rx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      encounterId: data.encounterId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      hospitalId: data.hospitalId,
      items: data.items,
      status: data.status ?? "pending",
      workflowStatus: data.workflowStatus ?? "finalized",
      createdAt: now,
      finalizedAt: now,
      updatedAt: now,
    });

    return plain<any>(doc);
  }
  async updateStatus(prescriptionId: string, status: string, ctx: AccessContext): Promise<MedicalPrescription | null> {
    await dbConnect();
    const existing = await PrescriptionModel.findById(prescriptionId).lean();
    if (existing) assertPatientAccess(ctx, String((existing as unknown as { patientId?: unknown }).patientId));
    const doc = await PrescriptionModel.findByIdAndUpdate(
      prescriptionId,
      { $set: { status, updatedAt: new Date().toISOString() } },
      { new: true }
    ).lean();
    return plain<MedicalPrescription>(doc);
  }

  async countPrescriptionsByStatus(
    hospitalId: string,
    status: string,
    ctx: AccessContext
  ): Promise<number> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    return PrescriptionModel.countDocuments({ hospitalId, status });
  }

  async findSentToPharmacy(hospitalId: string, ctx: AccessContext, limit = 100): Promise<MedicalPrescription[]> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const docs = await PrescriptionModel.find({
      hospitalId,
      status: { $in: ["sent_to_pharmacy", "partially_dispensed"] },
    })
      .sort({ finalizedAt: -1 })
      .limit(limit)
      .lean();
    return plainList<MedicalPrescription>(docs);
  }
}

export const prescriptionRepository = new PrescriptionRepository();


/* ---------- Lab (read-only wrapper over DiagnosticOrder/Result) ---------- */

export class LabRepository {
  async findOrdersByPatient(patientId: string, ctx: AccessContext): Promise<DiagnosticOrder[]> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const docs = await DiagnosticOrderModel.find({ patientId }).sort({ orderedAt: -1 }).limit(50).lean();
    return plainList<DiagnosticOrder>(docs);
  }

  async findResultsByPatient(patientId: string, ctx: AccessContext): Promise<DiagnosticResult[]> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const docs = await DiagnosticResultModel.find({ patientId }).sort({ createdAt: -1 }).limit(100).lean();
    return plainList<DiagnosticResult>(docs);
  }

  async findResultsByOrder(orderId: string, ctx: AccessContext): Promise<DiagnosticResult[]> {
    await dbConnect();
    const docs = await DiagnosticResultModel.find({ orderId }).lean();
    if (docs.length && docs[0]) assertPatientAccess(ctx, String((docs[0] as any).patientId));
    return plainList<DiagnosticResult>(docs);
  }
}

export const labRepository = new LabRepository();

/* ---------- Document (read-only wrapper over DocumentMeta) ---------- */

export class DocumentRepository {
  async findByPatient(patientId: string, ctx: AccessContext): Promise<MedicalDocument[]> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const docs = await DocumentMetaModel.find({ patientId }).sort({ createdAt: -1 }).limit(100).lean();
    return plainList<MedicalDocument>(docs);
  }

  async findByEncounter(encounterId: string, ctx: AccessContext): Promise<MedicalDocument[]> {
    await dbConnect();
    const docs = await DocumentMetaModel.find({ encounterId }).lean();
    if (docs.length && docs[0]) assertPatientAccess(ctx, String((docs[0] as any).patientId));
    return plainList<MedicalDocument>(docs);
  }
}

export const documentRepository = new DocumentRepository();

/* ---------- Break-Glass ---------- */

export class BreakGlassRepository {
  async create(data: {
    patientId: string;
    requestorId: string;
    requestorName: string;
    requestorRole: string;
    reason: string;
    hospitalId: string;
  }): Promise<BreakGlassRequest> {
    await dbConnect();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hour window
    const id = `bg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const doc = await BreakGlassRequestModel.create({
      _id: id,
      patientId: data.patientId,
      requestorId: data.requestorId,
      requestorName: data.requestorName,
      requestorRole: data.requestorRole,
      reason: data.reason,
      hospitalId: data.hospitalId,
      status: "approved",
      expiresAt,
      createdAt: now,
    });

    return plain<BreakGlassRequest>(doc);
  }

  async findActive(patientId: string, requestorId: string): Promise<BreakGlassRequest | null> {
    await dbConnect();
    const now = new Date().toISOString();
    const doc = await BreakGlassRequestModel.findOne({
      patientId,
      requestorId,
      status: "approved",
      expiresAt: { $gt: now },
    }).sort({ createdAt: -1 }).lean();
    return plain<BreakGlassRequest>(doc);
  }

  async expireAll(): Promise<number> {
    await dbConnect();
    const res = await BreakGlassRequestModel.updateMany(
      { status: "approved", expiresAt: { $lte: new Date().toISOString() } },
      { $set: { status: "expired" } }
    );
    return res.modifiedCount;
  }
}

export const breakGlassRepository = new BreakGlassRepository();

/* ---------- Correction Request ---------- */

export class CorrectionRequestRepository {
  async create(data: {
    patientId: string;
    requestorId: string;
    targetType: CorrectionRequest["targetType"];
    targetId?: string;
    requestedChanges: CorrectionRequest["requestedChanges"];
    reason?: string;
  }): Promise<CorrectionRequest> {
    await dbConnect();
    const id = `cr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const doc = await CorrectionRequestModel.create({
      _id: id,
      patientId: data.patientId,
      requestorId: data.requestorId,
      targetType: data.targetType,
      targetId: data.targetId,
      requestedChanges: data.requestedChanges,
      reason: data.reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return plain<CorrectionRequest>(doc);
  }

  async findByPatient(patientId: string, ctx: AccessContext): Promise<CorrectionRequest[]> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const docs = await CorrectionRequestModel.find({ patientId }).sort({ createdAt: -1 }).lean();
    return plainList<CorrectionRequest>(docs);
  }

  async findPending(): Promise<CorrectionRequest[]> {
    await dbConnect();
    const docs = await CorrectionRequestModel.find({ status: "pending" }).sort({ createdAt: 1 }).lean();
    return plainList<CorrectionRequest>(docs);
  }

  async review(correctionId: string, status: "approved" | "rejected", reviewedBy: string): Promise<CorrectionRequest | null> {
    await dbConnect();
    const doc = await CorrectionRequestModel.findByIdAndUpdate(
      correctionId,
      {
        $set: {
          status,
          reviewedBy,
          reviewedAt: new Date().toISOString(),
        },
      },
      { new: true }
    ).lean();
    return plain<CorrectionRequest>(doc);
  }
}

export const correctionRequestRepository = new CorrectionRequestRepository();

/* ---------- Consultation notes (read) ---------- */

export class ConsultationRepository {
  async findByEncounter(encounterId: string, ctx: AccessContext): Promise<any | null> {
    await dbConnect();
    const doc = await ConsultationModel.findOne({ encounterId }).lean();
    if (!doc) return null;
    assertPatientAccess(ctx, String((doc as any).patientId));
    return plain<any>(doc);
  }

  async findByPatient(patientId: string, ctx: AccessContext): Promise<any[]> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const docs = await ConsultationModel.find({ patientId }).sort({ createdAt: -1 }).limit(50).lean();
    return plainList<any>(docs);
  }
}

export const consultationRepository = new ConsultationRepository();
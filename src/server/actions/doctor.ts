"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { DoctorModel, OpdModel, DepartmentModel, HospitalModel, EncounterModel } from "@/lib/models";
import { plain } from "@/lib/models";
import { getSession } from "@/lib/auth";
import type { DoctorProfile, Encounter, OPDCounts } from "@/types";

export async function getDoctorProfile(): Promise<DoctorProfile | null> {
  const session = await getSession();
  if (!session) return null;

  await dbConnect();
  // Staff users may have a linked doctor record in their scope
  const doctor = await DoctorModel.findOne({ _id: session.id }).lean();
  if (!doctor) {
    // Fallback: try to find by hospital/department from scope
    const byScope = await DoctorModel.findOne({
      hospitalId: session.scope.hospitalId,
      departmentId: session.scope.departmentId,
    }).lean();
    if (!byScope) return null;
    return buildDoctorProfile(byScope as Record<string, unknown>);
  }
  return buildDoctorProfile(doctor as Record<string, unknown>);
}

async function buildDoctorProfile(doc: Record<string, unknown>): Promise<DoctorProfile | null> {
  const opdIds = (doc.opdIds ?? []) as string[];
  const opd = opdIds[0]
    ? await OpdModel.findOne({ _id: opdIds[0] }).lean<{ name: string; _id: string }>()
    : null;
  const dept = await DepartmentModel.findOne({ _id: doc.departmentId as string }).lean<{ name: string; hospitalId: string }>();
  const hosp = dept ? await HospitalModel.findOne({ _id: dept.hospitalId }).lean<{ name: string }>() : null;

  return {
    id: doc._id as string,
    name: doc.name as string,
    speciality: (doc.speciality as string) ?? "",
    hospitalId: doc.hospitalId as string,
    hospitalName: hosp?.name ?? "",
    departmentId: doc.departmentId as string,
    departmentName: dept?.name ?? "",
    opdId: opdIds[0] ?? "",
    opdName: opd?.name ?? "",
  };
}

export async function getOrCreateEncounterForToken(
  tokenNumber: string,
  doctorId: string
): Promise<Encounter | null> {
  await dbConnect();
  const existing = await EncounterModel.findOne({ tokenNumber }).lean();
  if (existing) return plain<Encounter>(existing);

  const now = new Date().toISOString();
  const encounterId = `E${now.slice(0, 10).replace(/-/g, "")}${String(Date.now()).slice(-4)}`;

  // Look up doctor, opd, department, hospital context
  const doctor = await DoctorModel.findOne({ _id: doctorId }).lean<{ hospitalId: string; departmentId: string; opdIds: string[]; name: string }>();
  const opdId = doctor?.opdIds?.[0] ?? "opd_001";
  const opd = await OpdModel.findOne({ _id: opdId }).lean<{ departmentId: string; name: string }>();
  const dept = opd ? await DepartmentModel.findOne({ _id: opd.departmentId }).lean<{ hospitalId: string; name: string }>() : null;
  const hosp = dept ? await HospitalModel.findOne({ _id: dept.hospitalId }).lean<{ name: string }>() : null;

  // Look up patient from token
  const QueueEntryModel = (await import("@/lib/models")).QueueEntryModel;
  const queueEntry = await QueueEntryModel.findOne({ tokenNumber }).lean<{ patientId: string | null }>();

  const encounter = {
    _id: encounterId,
    patientId: queueEntry?.patientId ?? "",
    doctorId: doctorId,
    hospitalId: dept?.hospitalId ?? "",
    departmentId: opd?.departmentId ?? "",
    opdId,
    tokenNumber,
    date: now.slice(0, 10),
    hospitalName: hosp?.name ?? "",
    departmentName: dept?.name ?? "",
    doctorName: doctor?.name ?? "",
    status: "open" as const,
    createdAt: now,
    updatedAt: now,
  };

  await EncounterModel.create(encounter);
  return plain<Encounter>(encounter);
}

export async function listDoctorEncounters(
  doctorId: string,
  limit = 50
): Promise<Encounter[]> {
  await dbConnect();
  const docs = await EncounterModel.find({ doctorId })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
  return docs.map((d) => plain<Encounter>(d)!);
}

export async function updateEncounterStatus(
  encounterId: string,
  patch: Record<string, unknown>
): Promise<void> {
  await dbConnect();
  await EncounterModel.updateOne(
    { _id: encounterId },
    { $set: { ...patch, updatedAt: new Date().toISOString() } }
  );
}

export async function getEncounterById(id: string): Promise<Encounter | null> {
  await dbConnect();
  const doc = await EncounterModel.findOne({ _id: id }).lean();
  return plain<Encounter>(doc);
}

export async function getConsultationContextForEncounter(
  encounterId: string
): Promise<{ encounter: Encounter; patient: Record<string, unknown> | null; doctor: DoctorProfile } | null> {
  const encounter = await getEncounterById(encounterId);
  if (!encounter) return null;

  await dbConnect();
  const { PatientModel } = await import("@/lib/models");
  const patientDoc = await PatientModel.findOne({ _id: encounter.patientId }).lean();
  const doctor = await getDoctorProfile();
  if (!doctor) return null;

  return {
    encounter,
    patient: plain(patientDoc),
    doctor,
  };
}

export async function getCurrentSessionAction(): Promise<{ id: string; role: string } | null> {
  const session = await getSession();
  if (!session) return null;
  return { id: session.id, role: session.role };
}

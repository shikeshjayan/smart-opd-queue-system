"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { PatientModel, EncounterModel } from "@/lib/models";
import type { PatientSummary, Encounter } from "@/types";
import { plain, plainList } from "@/lib/models";

export async function getPatient(id: string): Promise<PatientSummary | null> {
  await dbConnect();
  const doc = await PatientModel.findOne({ _id: id }).lean();
  return plain<PatientSummary>(doc);
}

export async function listPatientsByHospital(hospitalId: string): Promise<PatientSummary[]> {
  await dbConnect();
  const docs = await PatientModel.find({ registeredHospitalId: hospitalId }).lean();
  return plainList<PatientSummary>(docs);
}

export async function searchPatients(query: string, hospitalId?: string): Promise<PatientSummary[]> {
  await dbConnect();
  const filter: Record<string, unknown> = {};
  if (hospitalId) filter.registeredHospitalId = hospitalId;
  if (query) {
    filter.$or = [
      { _id: { $regex: query, $options: "i" } },
      { name: { $regex: query, $options: "i" } },
      { phone: { $regex: query, $options: "i" } },
      { patientNumber: { $regex: query, $options: "i" } },
    ];
  }
  const docs = await PatientModel.find(filter).limit(20).lean();
  return plainList<PatientSummary>(docs);
}

export async function listEncounters(patientId: string): Promise<Encounter[]> {
  await dbConnect();
  const docs = await EncounterModel.find({ patientId }).sort({ date: -1 }).lean();
  return plainList<Encounter>(docs);
}

export async function listAllEncounters(): Promise<Encounter[]> {
  await dbConnect();
  const docs = await EncounterModel.find().sort({ date: -1 }).limit(100).lean();
  return plainList<Encounter>(docs);
}

export async function getEncounter(id: string): Promise<Encounter | null> {
  await dbConnect();
  const doc = await EncounterModel.findOne({ _id: id }).lean();
  return plain<Encounter>(doc);
}

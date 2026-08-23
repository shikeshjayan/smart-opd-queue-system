"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { AppointmentModel } from "@/lib/models";
import { plainList } from "@/lib/models";

export async function listAppointmentsByPatient(patientId: string): Promise<Record<string, unknown>[]> {
  await dbConnect();
  const docs = await AppointmentModel.find({ patientId }).sort({ date: 1 }).lean();
  return plainList(docs);
}

export async function listAppointmentsByHospital(
  hospitalId: string,
  date?: string
): Promise<Record<string, unknown>[]> {
  await dbConnect();
  const filter: Record<string, unknown> = { hospitalId };
  if (date) filter.date = date;
  const docs = await AppointmentModel.find(filter).sort({ time: 1 }).lean();
  return plainList(docs);
}

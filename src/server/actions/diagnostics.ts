"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { DiagnosticOrderModel } from "@/lib/models";
import { plainList } from "@/lib/models";

export async function listDiagnosticOrdersByPatient(patientId: string): Promise<Record<string, unknown>[]> {
  await dbConnect();
  const docs = await DiagnosticOrderModel.find({ patientId }).sort({ orderedAt: -1 }).lean();
  return plainList(docs);
}

export async function listDiagnosticOrdersByDoctor(doctorId: string): Promise<Record<string, unknown>[]> {
  await dbConnect();
  const docs = await DiagnosticOrderModel.find({ doctorId }).sort({ orderedAt: -1 }).lean();
  return plainList(docs);
}

export async function listDiagnosticOrdersByHospital(hospitalId: string): Promise<Record<string, unknown>[]> {
  await dbConnect();
  const docs = await DiagnosticOrderModel.find({ hospitalId }).sort({ orderedAt: -1 }).lean();
  return plainList(docs);
}

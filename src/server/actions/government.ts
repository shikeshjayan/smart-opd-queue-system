"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { GovernmentAlertModel } from "@/lib/models";
import { plainList } from "@/lib/models";

export async function listGovernmentAlerts(districtId?: string): Promise<Record<string, unknown>[]> {
  await dbConnect();
  const filter: Record<string, unknown> = {};
  if (districtId) filter.districtId = districtId;
  const docs = await GovernmentAlertModel.find(filter).sort({ createdAt: -1 }).lean();
  return plainList(docs);
}

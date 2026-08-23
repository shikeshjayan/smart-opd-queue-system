"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { NotificationModel, AdminSettingsModel } from "@/lib/models";
import { plainList } from "@/lib/models";

export async function listNotificationsByHospital(hospitalId: string): Promise<Record<string, unknown>[]> {
  await dbConnect();
  const docs = await NotificationModel.find({ hospitalId, audience: "hospital" })
    .sort({ createdAt: -1 })
    .lean();
  return plainList(docs);
}

export async function listNotificationsByUser(userId: string): Promise<Record<string, unknown>[]> {
  await dbConnect();
  const docs = await NotificationModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
  return plainList(docs);
}

export async function markNotificationRead(id: string): Promise<void> {
  await dbConnect();
  await NotificationModel.updateOne({ _id: id }, { $set: { read: true } });
}

export async function getAdminSettings(hospitalId: string): Promise<Record<string, unknown> | null> {
  await dbConnect();
  const doc = await AdminSettingsModel.findOne({ hospitalId }).lean();
  if (!doc) return null;
  const { _id, ...rest } = doc as Record<string, unknown>;
  return rest;
}

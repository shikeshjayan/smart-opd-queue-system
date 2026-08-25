"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  NotificationModel,
  NotificationDeliveryModel,
  NotificationPreferenceModel,
  NotificationJobModel,
} from "@/lib/models";
import { plainList, plain } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { roleHasPermission } from "@/features/auth/permissions";
import { processQueue } from "@/server/notifications/worker";

/* ───────── Query actions ───────── */

export async function listMyNotifications(limit = 50) {
  await dbConnect();
  const user = await getSession();
  if (!user) return [];
  const docs = await NotificationModel.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return plainList(docs);
}

export async function listStaffNotifications(hospitalId: string, limit = 50) {
  await dbConnect();
  const docs = await NotificationModel.find({ hospitalId, audience: "staff" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return plainList(docs);
}

export async function unreadCount(): Promise<number> {
  await dbConnect();
  const user = await getSession();
  if (!user) return 0;
  return NotificationModel.countDocuments({ userId: user.id, read: false });
}

export async function getNotificationHistory(notificationId: string) {
  await dbConnect();
  const deliveries = await NotificationDeliveryModel.find({ notificationId })
    .sort({ createdAt: 1 })
    .lean();
  return plainList(deliveries);
}

/* ───────── Mutation actions ───────── */

export async function markRead(notificationId: string) {
  await dbConnect();
  const now = new Date().toISOString();
  await NotificationModel.updateOne(
    { _id: notificationId },
    { $set: { read: true, readAt: now } }
  );
  await NotificationDeliveryModel.updateMany(
    { notificationId, channel: "in_app" },
    { $set: { state: "read", readAt: now, updatedAt: now } }
  );
}

export async function markAllRead() {
  await dbConnect();
  const user = await getSession();
  if (!user) return 0;
  const now = new Date().toISOString();
  const result = await NotificationModel.updateMany(
    { userId: user.id, read: false },
    { $set: { read: true, readAt: now } }
  );
  await NotificationDeliveryModel.updateMany(
    { channel: "in_app", state: { $ne: "read" }, notificationId: { $in: (await NotificationModel.find({ userId: user.id }).select("_id").lean()).map((n: any) => n._id) } },
    { $set: { state: "read", readAt: now, updatedAt: now } }
  );
  return result.modifiedCount;
}

/* ───────── Preferences ───────── */

export async function getPreferences() {
  await dbConnect();
  const user = await getSession();
  if (!user) return null;
  const doc = await NotificationPreferenceModel.findOne({ patientId: user.id }).lean();
  return plain(doc);
}

export async function savePreferences(input: {
  sms?: boolean;
  email?: boolean;
  push?: boolean;
  appointmentReminders?: boolean;
  queueUpdates?: boolean;
  resultNotifications?: boolean;
  prescriptionNotifications?: boolean;
  followUpReminders?: boolean;
  announcements?: boolean;
  locale?: string;
}) {
  await dbConnect();
  const user = await getSession();
  if (!user) return null;
  const now = new Date().toISOString();
  const doc = await NotificationPreferenceModel.findOneAndUpdate(
    { patientId: user.id },
    { $set: { ...input, updatedAt: now } },
    { new: true, upsert: true }
  ).lean();
  return plain(doc);
}

/* ───────── Announcements ───────── */

export async function sendAnnouncement(input: {
  message: string;
  departmentId?: string;
  targetScope?: "all" | "department" | "appointment_group";
  appointmentDate?: string;
}) {
  await dbConnect();
  const user = await getSession();
  if (!user) throw new Error("Authentication required");
  if (!roleHasPermission(user.role, "SEND_ANNOUNCEMENT")) throw new Error("Permission denied");

  const { notifyMany } = await import("@/server/notifications/service");
  const count = await notifyMany(
    ["_all"], // resolved by service using hospital scope
    {
      templateKey: "HOSPITAL_ANNOUNCEMENT",
      params: { message: input.message },
      hospitalId: user.scope?.hospitalId,
      audience: "patient",
      announcementBody: input.message,
      sentBy: user.id,
      resourceType: "announcement",
    }
  );
  return { sent: count > 0, recipients: count };
}

/* ───────── Notification health / monitoring (§20) ───────── */

export async function getNotificationHealth(hospitalId?: string) {
  await dbConnect();
  const user = await getSession();
  if (!user || !roleHasPermission(user.role, "VIEW_NOTIFICATION_HEALTH")) throw new Error("Permission denied");

  const baseFilter: Record<string, unknown> = {};
  if (hospitalId) baseFilter.hospitalId = hospitalId;

  const since24h = new Date(Date.now() - 86400_000).toISOString();
  const recentFilter = { ...baseFilter, createdAt: { $gte: since24h } };

  const [totalNotifications, totalDeliveries, failedDeliveries, pendingJobs, deadJobs] = await Promise.all([
    NotificationModel.countDocuments(baseFilter),
    NotificationDeliveryModel.countDocuments(baseFilter),
    NotificationDeliveryModel.countDocuments({ ...baseFilter, state: "failed" }),
    NotificationJobModel.countDocuments({ state: "queued" }),
    NotificationJobModel.countDocuments({ state: "dead" }),
  ]);

  // By channel: sent / delivered / failed in last 24h
  const channelStats = await NotificationDeliveryModel.aggregate([
    { $match: recentFilter },
    { $group: { _id: "$channel", total: { $sum: 1 }, sent: { $sum: { $cond: [{ $eq: ["$state", "sent"] }, 1, 0] } }, delivered: { $sum: { $cond: [{ $eq: ["$state", "delivered"] }, 1, 0] } }, failed: { $sum: { $cond: [{ $eq: ["$state", "failed"] }, 1, 0] } } } },
  ]);

  // Recent failures
  const recentFailures = await NotificationDeliveryModel.find({ ...baseFilter, state: "failed" })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  return {
    totalNotifications,
    totalDeliveries,
    failedDeliveries,
    pendingJobs,
    deadJobs,
    channelStats: channelStats.map((c) => ({ channel: c._id, total: c.total, sent: c.sent, delivered: c.delivered, failed: c.failed })),
    recentFailures: plainList(recentFailures),
  };
}

export async function retryNotification(notificationId: string) {
  await dbConnect();
  const user = await getSession();
  if (!user || !roleHasPermission(user.role, "RETRY_NOTIFICATION")) throw new Error("Permission denied");

  await NotificationDeliveryModel.updateMany(
    { notificationId, state: "failed" },
    { $set: { state: "pending", attempts: 0, lastError: null, updatedAt: new Date().toISOString() } }
  );

  // Re-enqueue by creating a job with the failed delivery's channel
  const { notify } = await import("@/server/notifications/service");
  const notification = await NotificationModel.findById(notificationId).lean();
  if (notification) {
    for (const channel of (notification as any).channels ?? []) {
      if (channel === "in_app") continue;
      await notify({
        userId: (notification as any).userId,
        templateKey: (notification as any).templateKey,
        params: {},
        hospitalId: (notification as any).hospitalId,
        audience: (notification as any).audience,
        resourceType: (notification as any).resourceType,
        resourceId: notificationId,
      });
    }
  }
  return { retrying: true };
}

/* ───────── Lazy worker drain (§17: safety net) ───────── */

export async function drainQueue(limit = 50) {
  await processQueue(limit);
}

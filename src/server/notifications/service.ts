import "server-only";
import { dbConnect } from "@/lib/db";
import {
  NotificationJobModel,
  NotificationModel,
  NotificationPreferenceModel,
} from "@/lib/models";
import type { NotificationChannel } from "./templates";
import { renderTemplate, TEMPLATES, preferenceGroupFor } from "./templates";

export interface SendInput {
  userId: string;
  templateKey: string;
  params?: Record<string, string | number>;
  /** Logical event key for idempotency (§16), e.g. "appointment:APT-10292:confirmed". */
  idempotencyKey?: string;
  /** ISO timestamp when a scheduled notification (reminder) should fire. */
  dueAt?: string;
  hospitalId?: string;
  audience?: "patient" | "staff";
  resourceType?: string;
  resourceId?: string;
  sentBy?: string;
  extraChannels?: NotificationChannel[];
  announcementBody?: string;
}

export interface SendResult {
  jobId: string | null;
  duplicate: boolean;
}

/**
 * Event-driven entry point (§1, §17). Callers NEVER talk to providers;
 * this only validates + enqueues a durable job. Hospital workflows do not
 * block on notification delivery.
 */
export async function notify(input: SendInput): Promise<SendResult> {
  await dbConnect();

  const def = TEMPLATES[input.templateKey];
  if (!def) return { jobId: null, duplicate: false };

  // Idempotency (§16): one logical event → at most one job.
  const key =
    input.idempotencyKey ??
    `${input.templateKey}:${input.userId}:${JSON.stringify(input.params ?? {})}:${input.dueAt ?? ""}`;
  const existing = await NotificationJobModel.findOne({
    idempotencyKey: key,
    state: { $in: ["queued", "processing", "done"] },
  })
    .select("_id")
    .lean();
  if (existing) return { jobId: String(existing._id), duplicate: true };

  const doc = await NotificationJobModel.create({
    payload: {
      userId: input.userId,
      templateKey: input.templateKey,
      params: input.params ?? {},
      hospitalId: input.hospitalId,
      audience: input.audience ?? "patient",
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      sentBy: input.sentBy,
      extraChannels: input.extraChannels ?? [],
      announcementBody: input.announcementBody,
    },
    idempotencyKey: key,
    runAfter: input.dueAt ? new Date(input.dueAt) : new Date(),
    maxAttempts: 3,
  });
  return { jobId: String(doc._id), duplicate: false };
}

export async function notifyMany(userIds: string[], base: Omit<SendInput, "userId">): Promise<number> {
  let count = 0;
  for (const userId of userIds) {
    const res = await notify({ ...base, userId });
    if (res.jobId && !res.duplicate) count += 1;
  }
  return count;
}

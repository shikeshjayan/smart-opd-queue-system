import "server-only";
import { dbConnect } from "@/lib/db";
import {
  NotificationJobModel,
  NotificationDeliveryModel,
  NotificationModel,
  NotificationPreferenceModel,
  UserModel,
} from "@/lib/models";
import { normalizeLocale, t, type Locale } from "@/lib/i18n";
import { renderTemplate, preferenceGroupFor, TEMPLATES } from "./templates";
import type { NotificationChannel } from "./templates";
import {
  mockSmsProvider,
  mockPushProvider,
  mockEmailProvider,
  consoleProvider,
} from "./providers/mock";
import type { NotificationProvider } from "./providers/types";
import { broadcastToUser } from "@/features/realtime/server/broadcast";

const BACKOFF_MS = [60_000, 300_000, 900_000];
const LEASE_MS = 60_000;

function providerFor(channel: NotificationChannel): NotificationProvider {
  switch (channel) {
    case "sms":
      return mockSmsProvider;
    case "push":
      return mockPushProvider;
    case "email":
      return mockEmailProvider;
    default:
      return consoleProvider(channel);
  }
}

interface JobPayload {
  userId: string;
  templateKey: string;
  params: Record<string, string | number>;
  hospitalId?: string;
  audience: "patient" | "staff";
  resourceType?: string;
  resourceId?: string;
  sentBy?: string;
  extraChannels?: NotificationChannel[];
  announcementBody?: string;
}

/** Reclaim jobs whose worker crashed mid-flight. */
async function reclaimExpiredLeases(): Promise<void> {
  await NotificationJobModel.updateMany(
    { state: "processing", leaseExpiresAt: { $lt: new Date() } },
    { $set: { state: "queued", lockedAt: null, leaseExpiresAt: null } }
  );
}

async function resolveContact(userId: string): Promise<{ name?: string; phone?: string }> {
  const user = await UserModel.findById(userId).select("name phone").lean();
  return user ? { name: user.name, phone: user.phone ?? undefined } : {};
}

/**
 * Queue worker (§17): claims jobs atomically so multiple concurrent
 * invocations (cron + lazy drain) never double-process.
 */
export async function processQueue(limit = 50): Promise<{ processed: number; failed: number }> {
  await dbConnect();
  await reclaimExpiredLeases();

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < limit; i++) {
    const job = await NotificationJobModel.findOneAndUpdate(
      {
        state: "queued",
        runAfter: { $lte: new Date() },
      },
      {
        $set: {
          state: "processing",
          lockedAt: new Date(),
          leaseExpiresAt: new Date(Date.now() + LEASE_MS),
        },
        $inc: { attempts: 1 },
      },
      { sort: { runAfter: 1 }, new: true }
    );
    if (!job) break;

    try {
      await deliverJob(job);
      processed += 1;
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : "Unknown worker error";
      if (job.attempts >= job.maxAttempts) {
        await NotificationJobModel.updateOne(
          { _id: job._id, state: "processing" },
          { $set: { state: "dead", lastError: message, leaseExpiresAt: null } }
        );
      } else {
        const backoff = BACKOFF_MS[Math.min(job.attempts - 1, BACKOFF_MS.length - 1)];
        await NotificationJobModel.updateOne(
          { _id: job._id, state: "processing" },
          {
            $set: {
              state: "queued",
              runAfter: new Date(Date.now() + backoff),
              lastError: message,
              lockedAt: null,
              leaseExpiresAt: null,
            },
          }
        );
      }
    }
  }

  return { processed, failed };
}

async function deliverJob(job: {
  _id: unknown;
  payload: unknown;
}): Promise<void> {
  const payload = job.payload as JobPayload;
  const def = TEMPLATES[payload.templateKey];
  if (!def) throw new Error(`Unknown template ${payload.templateKey}`);

  const [prefsRow, contact] = await Promise.all([
    NotificationPreferenceModel.findOne({ patientId: payload.userId }).lean(),
    payload.audience === "patient"
      ? resolveContact(payload.userId)
      : Promise.resolve({} as { name?: string; phone?: string }),
  ]);

  const locale: Locale = normalizeLocale(prefsRow?.locale);
  const params = { ...payload.params };
  let bodyOverrideEn: string | undefined;
  let bodyOverrideMl: string | undefined;
  if (payload.templateKey === "HOSPITAL_ANNOUNCEMENT" && payload.announcementBody) {
    bodyOverrideEn = payload.announcementBody;
    bodyOverrideMl = payload.announcementBody;
  }
  const rendered =
    bodyOverrideEn && bodyOverrideMl
      ? (() => {
          const base = renderTemplate(payload.templateKey, locale, params, payload.extraChannels ?? []);
          return base
            ? {
                ...base,
                title: t(locale, "announcement.title"),
                bodyEn: bodyOverrideEn,
                bodyMl: bodyOverrideMl,
              }
            : undefined;
        })()
      : renderTemplate(payload.templateKey, locale, params, payload.extraChannels ?? []);
  if (!rendered) throw new Error(`Render failed for ${payload.templateKey}`);

  // Channel gating (§23, §24): preferences apply to optional comms only;
  // required templates bypass category toggles but still need a usable address.
  const group = preferenceGroupFor(payload.templateKey);
  const optedOut = !def.required && group !== null && prefsRow && prefsRow[group] === false;

  const allowed: NotificationChannel[] = [];
  for (const ch of rendered.channels) {
    if (ch === "in_app") {
      allowed.push(ch);
      continue;
    }
    if (optedOut) continue;
    if (ch === "sms") {
      if (!contact.phone) continue;
      if (!def.required && !(prefsRow?.sms ?? true)) continue;
    }
    if (ch === "email") {
      const email = contactEmail(prefsRow);
      if (!email) continue;
      if (!def.required && !(prefsRow?.email ?? false)) continue;
    }
    if (ch === "push") {
      if (!def.required && !(prefsRow?.push ?? true)) continue;
    }
    allowed.push(ch);
  }

  const nowIso = new Date().toISOString();
  const notification = await NotificationModel.create({
    hospitalId: payload.hospitalId,
    userId: payload.userId,
    audience: payload.audience === "staff" ? "staff" : "patient",
    templateKey: payload.templateKey,
    category: rendered.category,
    title: rendered.title,
    message: locale === "ml" ? rendered.bodyMl : rendered.bodyEn,
    bodyEn: rendered.bodyEn,
    bodyMl: rendered.bodyMl,
    locale,
    priority: rendered.priority,
    required: rendered.required,
    read: false,
    deepLink: rendered.deepLink,
    resourceType: payload.resourceType,
    resourceId: payload.resourceId,
    channels: allowed,
    idempotencyKey: `n:${job._id}`,
    sentBy: payload.sentBy,
    createdAt: nowIso,
  });

  for (const channel of allowed) {
    const delivery: Record<string, unknown> = {
      notificationId: String(notification._id),
      channel,
      state: "pending",
      maxAttempts: channel === "in_app" ? 1 : 3,
      updatedAt: nowIso,
    };

    if (channel === "in_app") {
      delivery.state = "delivered";
      delivery.deliveredAt = nowIso;
    } else {
      const provider = providerFor(channel);
      try {
        const result = await provider.send({
          title: rendered.title,
          body: locale === "ml" ? rendered.bodyMl : rendered.bodyEn,
          recipientAddress: channel === "sms" ? contact.phone : undefined,
          deepLink: rendered.deepLink,
          meta: {
            templateKey: payload.templateKey,
            userId: payload.userId,
            ...(payload.resourceId ? { resourceId: payload.resourceId } : {}),
          },
        });
        delivery.attempts = 1;
        delivery.providerMessageId = result.providerMessageId;
        if (result.state === "failed") {
          delivery.state = "failed";
          delivery.lastError = result.error;
        } else if (result.state === "delivered") {
          delivery.state = "delivered";
          delivery.deliveredAt = new Date().toISOString();
          delivery.sentAt = nowIso;
        } else {
          delivery.state = "sent";
          delivery.sentAt = nowIso;
        }
      } catch (err) {
        delivery.attempts = 1;
        delivery.state = "failed";
        delivery.lastError = err instanceof Error ? err.message : "provider error";
      }
    }

    await NotificationDeliveryModel.create(delivery);
  }

  await NotificationJobModel.updateOne(
    { _id: job._id },
    { $set: { state: "done", lastError: null, leaseExpiresAt: null } }
  );

  // Emit realtime event so UI refreshes immediately (§28)
  if (payload.hospitalId) {
    await broadcastToUser(payload.userId, {
      type: "NOTIFICATION_EVENT",
      at: new Date().toISOString(),
      userId: payload.userId,
      hospitalId: payload.hospitalId,
    });
  }
}

function contactEmail(_prefs: unknown): string | undefined {
  // The system currently has no patient email field; email stays a
  // foundation channel and activates once addresses exist.
  return undefined;
}

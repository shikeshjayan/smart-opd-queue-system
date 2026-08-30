import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processQueue } from "@/server/notifications/worker";

/**
 * Notification worker cron endpoint (§17).
 * Call via: GET /api/cron/notifications
 * Guarded by CRON_SECRET header matching env var.
 *
 * Configure in vercel.json or any external scheduler:
 * { "path": "/api/cron/notifications", "scheme": "https" }
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!timingSafeStringEqual(token, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { processed, failed } = await processQueue(50);
  return NextResponse.json({ processed, failed, timestamp: new Date().toISOString() });
}
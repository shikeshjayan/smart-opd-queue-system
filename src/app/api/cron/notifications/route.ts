import { NextResponse } from "next/server";
import { processQueue } from "@/server/notifications/worker";

/**
 * Notification worker cron endpoint (§17).
 * Call via: GET /api/cron/notifications
 * Guarded by CRON_SECRET header matching env var.
 *
 * Configure in vercel.json or any external scheduler:
 * { "path": "/api/cron/notifications", "scheme": "https" }
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { processed, failed } = await processQueue(50);
  return NextResponse.json({ processed, failed, timestamp: new Date().toISOString() });
}

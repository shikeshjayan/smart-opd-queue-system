import type { RealtimeEvent } from "@/features/realtime/types/realtime.types";

/**
 * Server-side broadcast to a specific user via BroadcastChannel.
 * Runs in server context (actions/workers) — uses the same channel name
 * as the client so cross-tab refresh works when both tabs are open
 * on the same origin. In production this should be replaced with a
 * WebSocket / SSE server for true server-push.
 */
const CHANNEL_NAME = "smart-health-queue";

export async function broadcastToUser(userId: string, event: RealtimeEvent): Promise<void> {
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ ...event, targetUserId: userId });
    channel.close();
  } catch {
    // BroadcastChannel not available in some server environments (e.g. edge)
  }
}

/**
 * Server-wide broadcast (hospital/ops events). Same BroadcastChannel
 * transport — subscribers filter by event type and hospitalId.
 */
export async function broadcastToServer(event: RealtimeEvent): Promise<void> {
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(event);
    channel.close();
  } catch {
    // BroadcastChannel not available in some server environments (e.g. edge)
  }
}
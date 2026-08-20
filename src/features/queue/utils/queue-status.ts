import type { OPDStatus } from "@/types";
import { DELAYED_WAITING_THRESHOLD } from "../config";

export type QueueOperationalState = "normal" | "paused" | "closed" | "delayed";

export function queueOperationalState(
  status: OPDStatus,
  waiting: number
): QueueOperationalState {
  if (status === "closed") return "closed";
  if (status === "paused" || status === "unavailable") return "paused";
  if (status === "full") return "delayed";
  if (waiting >= DELAYED_WAITING_THRESHOLD) return "delayed";
  return "normal";
}

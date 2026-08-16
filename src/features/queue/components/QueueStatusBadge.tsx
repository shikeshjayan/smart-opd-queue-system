import type { QueueStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

const labels: Record<QueueStatus, string> = {
  waiting: "Waiting",
  called: "Called",
  in_consultation: "In Consultation",
  completed: "Completed",
  skipped: "Skipped",
  cancelled: "Cancelled",
  expired: "Expired",
  no_show: "No Show",
};

const variants: Record<QueueStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  waiting: "info",
  called: "warning",
  in_consultation: "warning",
  completed: "success",
  skipped: "default",
  cancelled: "danger",
  expired: "danger",
  no_show: "default",
};

type QueueStatusBadgeProps = {
  status: QueueStatus;
};

export function QueueStatusBadge({ status }: QueueStatusBadgeProps) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

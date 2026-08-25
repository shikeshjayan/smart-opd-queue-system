import { Badge } from "@/components/ui/badge";
import type { DiagnosticOrderStatus } from "@/services/diagnostics/types";

const LABELS: Record<DiagnosticOrderStatus, string> = {
  draft: "Draft",
  ordered: "Ordered",
  sample_pending: "Sample pending",
  sample_collected: "Sample collected",
  scheduled: "Scheduled",
  processing: "Processing",
  procedure_done: "Procedure done",
  result_pending: "Result pending",
  awaiting_verification: "Awaiting verification",
  verified: "Verified",
  published: "Published",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const VARIANTS: Record<DiagnosticOrderStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  draft: "default",
  ordered: "default",
  sample_pending: "warning",
  sample_collected: "info",
  scheduled: "info",
  processing: "info",
  procedure_done: "info",
  result_pending: "warning",
  awaiting_verification: "warning",
  verified: "success",
  published: "success",
  completed: "success",
  cancelled: "danger",
  rejected: "danger",
};

export function orderStatusLabel(status: DiagnosticOrderStatus): string {
  return LABELS[status];
}

export function OrderStatus({ status }: { status: DiagnosticOrderStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}

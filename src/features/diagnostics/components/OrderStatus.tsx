import { Badge } from "@/components/ui/badge";
import type { DiagnosticOrderStatus } from "@/services/diagnostics/types";

const LABELS: Record<DiagnosticOrderStatus, string> = {
  draft: "Draft",
  ordered: "Ordered",
  sample_collected: "Sample collected",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

const VARIANTS: Record<DiagnosticOrderStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  draft: "default",
  ordered: "default",
  sample_collected: "info",
  processing: "info",
  completed: "success",
  cancelled: "danger",
};

export function orderStatusLabel(status: DiagnosticOrderStatus): string {
  return LABELS[status];
}

export function OrderStatus({ status }: { status: DiagnosticOrderStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
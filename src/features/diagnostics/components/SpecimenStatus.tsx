import { Badge } from "@/components/ui/badge";
import type { SpecimenStatus } from "@/services/diagnostics/types";

const LABELS: Record<SpecimenStatus, string> = {
  pending: "Pending",
  collected: "Collected",
  received: "Received",
  processing: "Processing",
  rejected: "Rejected",
  completed: "Completed",
};

const VARIANTS: Record<SpecimenStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  pending: "default",
  collected: "info",
  received: "info",
  processing: "info",
  rejected: "danger",
  completed: "success",
};

export function specimenStatusLabel(status: SpecimenStatus): string {
  return LABELS[status];
}

export function SpecimenStatus({ status }: { status: SpecimenStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
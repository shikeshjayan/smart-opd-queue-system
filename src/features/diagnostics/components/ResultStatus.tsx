import { Badge } from "@/components/ui/badge";
import type { ResultStatus } from "@/services/diagnostics/types";

const LABELS: Record<ResultStatus, string> = {
  draft: "Draft",
  preliminary: "Preliminary",
  final: "Final",
  amended: "Amended",
  cancelled: "Cancelled",
};

const VARIANTS: Record<ResultStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  draft: "default",
  preliminary: "warning",
  final: "success",
  amended: "info",
  cancelled: "danger",
};

export function resultStatusLabel(status: ResultStatus): string {
  return LABELS[status];
}

export function ResultStatusBadge({ status }: { status: ResultStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
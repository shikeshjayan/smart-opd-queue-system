import { Badge } from "@/components/ui/badge";
import { normalizeResultStatus, type ResultStatus } from "@/services/diagnostics/types";

const LABELS: Record<ResultStatus, string> = {
  draft: "Draft",
  submitted_for_verification: "Awaiting verification",
  verified: "Verified",
  published: "Published",
  preliminary: "Preliminary",
  final: "Final",
  amended: "Amended",
  cancelled: "Cancelled",
};

const VARIANTS: Record<ResultStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  draft: "default",
  submitted_for_verification: "warning",
  verified: "success",
  published: "success",
  preliminary: "warning",
  final: "success",
  amended: "info",
  cancelled: "danger",
};

export function resultStatusLabel(status: ResultStatus): string {
  return LABELS[status];
}

export function ResultStatusBadge({ status }: { status: ResultStatus }) {
  const normalized = normalizeResultStatus(status);
  return <Badge variant={VARIANTS[normalized]}>{LABELS[normalized]}</Badge>;
}

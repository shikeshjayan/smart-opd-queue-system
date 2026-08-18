import { Badge } from "@/components/ui/badge";
import type { OPDTokenStatus } from "@/features/registration/types/registration.types";

const labels: Record<OPDTokenStatus, string> = {
  waiting: "Waiting",
  called: "Called",
  in_consultation: "Consulting",
  completed: "Completed",
  skipped: "Skipped",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const variants: Record<OPDTokenStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  waiting: "warning",
  called: "info",
  in_consultation: "info",
  completed: "success",
  skipped: "default",
  cancelled: "danger",
  no_show: "default",
};

export function TokenStatus({ status }: { status: OPDTokenStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
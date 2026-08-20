import { Badge } from "@/components/ui/badge";
import type { EncounterStatus } from "@/types";
import { encounterStatusLabel } from "../utils/status";

const STATUS_VARIANTS: Record<EncounterStatus, "default" | "success" | "warning" | "info" | "danger"> = {
  open: "info",
  in_progress: "warning",
  completed: "success",
  cancelled: "danger",
};

export function EncounterStatusBadge({ status }: { status: EncounterStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{encounterStatusLabel(status)}</Badge>;
}
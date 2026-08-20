import type { EncounterStatus } from "@/types";

export const ENCOUNTER_STATUS_LABELS: Record<EncounterStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function encounterStatusLabel(status: EncounterStatus): string {
  return ENCOUNTER_STATUS_LABELS[status] ?? status;
}
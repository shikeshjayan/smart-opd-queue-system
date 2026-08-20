import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/services/appointments/types";

const LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
  rescheduled: "Rescheduled",
};

const VARIANTS: Record<AppointmentStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  scheduled: "default",
  confirmed: "info",
  checked_in: "info",
  completed: "success",
  cancelled: "danger",
  no_show: "danger",
  rescheduled: "warning",
};

export function appointmentStatusLabel(status: AppointmentStatus): string {
  return LABELS[status];
}

export function AppointmentStatus({ status }: { status: AppointmentStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
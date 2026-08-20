import type { Appointment } from "@/services/appointments/types";
import { getDepartment, getHospital } from "@/services/data";
import { formatSlotTime } from "../utils/appointments-validation";

function daysUntil(date: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const a = new Date(`${today}T00:00:00`).getTime();
  const b = new Date(`${date}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function AppointmentReminder({ appointments }: { appointments: Appointment[] }) {
  const soonest = appointments
    .filter((a) => ["scheduled", "confirmed"].includes(a.status))
    .filter((a) => daysUntil(a.scheduledDate) >= 0 && daysUntil(a.scheduledDate) <= 2)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];

  if (!soonest) return null;

  const department = getDepartment(soonest.departmentId);
  const hospital = getHospital(soonest.hospitalId);
  const when =
    daysUntil(soonest.scheduledDate) === 0
      ? "today"
      : daysUntil(soonest.scheduledDate) === 1
        ? "tomorrow"
        : `in ${daysUntil(soonest.scheduledDate)} days`;

  return (
    <div className="rounded-card border border-status-info-soft bg-status-info-soft px-4 py-3">
      <p className="text-sm font-semibold text-status-info">Reminder</p>
      <p className="mt-1 text-sm text-ink-700">
        You have a {soonest.type.replace("_", " ")} appointment {when}
        {soonest.scheduledTime ? ` at ${formatSlotTime(soonest.scheduledTime)}` : ""} with{" "}
        {department?.name ?? "your department"} at {hospital?.name ?? "the hospital"}.
      </p>
    </div>
  );
}
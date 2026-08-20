import type { AppointmentBookingInput } from "@/services/appointments/types";

export function validateBooking(
  input: Partial<AppointmentBookingInput>
): { valid: boolean; errors: Partial<Record<"departmentId" | "scheduledDate" | "scheduledTime" | "patientId", string>> } {
  const errors: { valid: boolean; errors: Partial<Record<"departmentId" | "scheduledDate" | "scheduledTime" | "patientId", string>> }["errors"] = {};

  if (!input.patientId) errors.patientId = "Patient required";
  if (!input.departmentId) errors.departmentId = "Department required";

  if (!input.scheduledDate) {
    errors.scheduledDate = "Date required";
  } else if (input.scheduledDate < new Date().toISOString().slice(0, 10)) {
    errors.scheduledDate = "Select a future date";
  }

  if (!input.scheduledTime) errors.scheduledTime = "Select a time slot";

  return { valid: Object.keys(errors).length === 0, errors };
}

export function formatSlotTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function weekdayLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" });
}
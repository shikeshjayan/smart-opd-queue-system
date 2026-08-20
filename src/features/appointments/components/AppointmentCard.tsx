import type { ReactNode } from "react";
import type { Appointment } from "@/services/appointments/types";
import { getDepartment, getHospital } from "@/services/data";
import { formatDate } from "@/features/medical-records/utils/format";
import { formatSlotTime } from "../utils/appointments-validation";
import { AppointmentStatus } from "./AppointmentStatus";

type AppointmentCardProps = {
  appointment: Appointment;
  actions?: ReactNode;
};

export function AppointmentCard({ appointment, actions }: AppointmentCardProps) {
  const department = getDepartment(appointment.departmentId);
  const hospital = getHospital(appointment.hospitalId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ink-200 bg-surface px-4 py-3 shadow-card">
      <div>
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-900">
          {formatDate(appointment.scheduledDate)}
          {appointment.scheduledTime && (
            <span className="text-xs font-normal text-ink-500">
              {formatSlotTime(appointment.scheduledTime)}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-ink-500">
          {department?.name ?? appointment.departmentId} · {hospital?.name ?? "Hospital"}
        </p>
        <p className="mt-0.5 text-xs capitalize text-ink-400">
          {appointment.type.replace("_", " ")}
          {appointment.reason ? ` · ${appointment.reason}` : ""}
          {appointment.tokenNumber ? ` · Token ${appointment.tokenNumber}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <AppointmentStatus status={appointment.status} />
        {actions}
      </div>
    </div>
  );
}
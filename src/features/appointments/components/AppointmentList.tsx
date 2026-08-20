import type { ReactNode } from "react";
import type { Appointment } from "@/services/appointments/types";
import { EmptyState } from "@/components/feedback/empty-state";
import { AppointmentCard } from "./AppointmentCard";

type AppointmentListProps = {
  appointments: Appointment[];
  actionsFor?: (appointment: Appointment) => ReactNode;
};

export function AppointmentList({ appointments, actionsFor }: AppointmentListProps) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter(
    (a) =>
      ["scheduled", "confirmed", "checked_in"].includes(a.status) && a.scheduledDate >= today
  );
  const past = appointments.filter(
    (a) => !["scheduled", "confirmed", "checked_in"].includes(a.status) || a.scheduledDate < today
  );

  if (appointments.length === 0) {
    return (
      <EmptyState title="No appointments" description="Book an appointment to get started." />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="upcoming-title">
        <h2 id="upcoming-title" className="text-lg font-semibold text-ink-900">
          Upcoming
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-ink-500">No upcoming appointments.</p>
          ) : (
            upcoming.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                actions={actionsFor ? actionsFor(appointment) : undefined}
              />
            ))
          )}
        </div>
      </section>

      <section aria-labelledby="past-title">
        <h2 id="past-title" className="text-lg font-semibold text-ink-900">
          Past
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {past.length === 0 ? (
            <p className="text-sm text-ink-500">No past appointments.</p>
          ) : (
            past.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                actions={actionsFor ? actionsFor(appointment) : undefined}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
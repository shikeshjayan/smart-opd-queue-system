"use client";

import { useMemo, useState } from "react";
import { useAsync } from "@/lib/use-async";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getPatient } from "@/services/data";
import { doctorService } from "@/services/doctor";
import { appointmentsMockApi } from "@/features/appointments/api/appointments.mock";
import { useDoctorSchedule } from "@/features/appointments/hooks/useAppointments";
import { AppointmentCalendar } from "@/features/appointments/components/AppointmentCalendar";
import { AppointmentCard } from "@/features/appointments/components/AppointmentCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

const today = () => new Date().toISOString().slice(0, 10);

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const doctorId = user?.id ?? "doc_001";
  const [selectedDate, setSelectedDate] = useState(today());

  const schedule = useDoctorSchedule(doctorId, selectedDate);
  const opd = useAsync(() => doctorService.getOpdSummary(), []);
  const grid = useAsync(async () => {
    const [year, month] = selectedDate.split("-");
    const start = `${year}-${month}-01`;
    const end = `${year}-${month}-${new Date(Number(year), Number(month), 0).getDate()}`;
    return appointmentsMockApi.listBetween(start, end);
  }, [selectedDate]);

  const dates = useMemo(
    () => (grid.data ?? []).filter((a) => a.doctorId === doctorId).map((a) => a.scheduledDate),
    [grid.data, doctorId]
  );

  if (schedule.isLoading || opd.isLoading || grid.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (schedule.error || opd.error) {
    return <ErrorState message={schedule.error ?? opd.error ?? "Unable to load schedule."} onRetry={schedule.reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Today&apos;s Schedule</h1>
        <p className="mt-1 text-sm text-ink-500">
          {opd.data?.departmentName} · {opd.data?.hospitalName}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <AppointmentCalendar dates={dates} selectedDate={selectedDate} onSelect={setSelectedDate} />

        <div className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="day-appointments-title" className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <h2 id="day-appointments-title" className="text-lg font-semibold text-ink-900">
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h2>
              <span className="text-sm text-ink-500">
                {schedule.data?.length ?? 0} appointment{(schedule.data?.length ?? 0) === 1 ? "" : "s"}
              </span>
            </div>
            {schedule.data && schedule.data.length > 0 ? (
              <div className="flex flex-col gap-2">
                {schedule.data.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    actions={
                      <span className="max-w-24 truncate text-xs text-ink-500">
                        {getPatient(appointment.patientId)?.name ?? appointment.patientId}
                      </span>
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No appointments" description="No appointments scheduled for this day." />
            )}
          </section>

          <section aria-labelledby="walkin-title" className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="walkin-title" className="text-lg font-semibold text-ink-900">
                Walk-in Queue
              </h2>
              <span className="text-sm text-ink-500">
                {opd.data?.counts.waiting ?? 0} waiting
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              {opd.data?.opd.name ?? "Today's OPD"} · {opd.data?.opd.startTime}–{opd.data?.opd.endTime}
            </p>
            <Button className="mt-3" variant="outline" onClick={() => setSelectedDate(today())}>
              Jump to Today
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
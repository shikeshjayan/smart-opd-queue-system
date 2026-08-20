"use client";

import Link from "next/link";
import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { getPatient, getDepartment, getHospital } from "@/services/data";
import { appointmentsMockApi } from "@/features/appointments/api/appointments.mock";
import { useAppointmentActions } from "@/features/appointments/hooks/useAppointments";
import { AppointmentCard } from "@/features/appointments/components/AppointmentCard";
import { CheckInResult } from "@/features/appointments/components/CheckInResult";
import { RescheduleDialog } from "@/features/appointments/components/RescheduleDialog";
import { CancelAppointmentDialog } from "@/features/appointments/components/CancelAppointmentDialog";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/features/consultation/utils/classes";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import type { Appointment, AppointmentWithToken } from "@/services/appointments/types";

const TODAY = () => new Date().toISOString().slice(0, 10);

type StatusFilter = "all" | "scheduled" | "checked_in" | "completed" | "cancelled" | "no_show";

export default function ReceptionAppointmentsPage() {
  const [date, setDate] = useState(TODAY());
  const [status, setStatus] = useState<StatusFilter>("all");
  const { data, isLoading, error, reload } = useAsync(
    () => appointmentsMockApi.listForDate(date),
    [date]
  );
  const actions = useAppointmentActions();
  const [checkInResult, setCheckInResult] = useState<AppointmentWithToken | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  const filtered = (data ?? []).filter((a) => status === "all" || a.status === status);

  const handleCheckIn = async (appointment: Appointment) => {
    const result = await actions.checkIn(appointment.id);
    if (result) {
      setCheckInResult(result);
      reload();
    }
  };

  const statusTabs: Array<[StatusFilter, string]> = [
    ["all", "All"],
    ["scheduled", "Scheduled"],
    ["checked_in", "Checked in"],
    ["completed", "Completed"],
    ["cancelled", "Cancelled"],
    ["no_show", "No-show"],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Appointments</h1>
          <p className="mt-1 text-sm text-ink-500">Manage scheduled visits and check-ins</p>
        </div>
        <Link
          href="/reception/appointments/new"
          className="inline-flex h-11 items-center rounded-btn bg-brand-600 px-5 font-medium text-white transition-colors hover:bg-brand-700"
        >
          New Appointment
        </Link>
      </div>

      {checkInResult && (
        <div className="mx-auto w-full max-w-md">
          <CheckInResult result={checkInResult} />
          <Button className="mt-3 w-full" variant="outline" onClick={() => setCheckInResult(null)}>
            Done
          </Button>
        </div>
      )}

      {actions.error && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-3 text-sm text-status-danger">
          {actions.error}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Date</span>
          <input
            className={inputCls}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {statusTabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                status === value
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-ink-300 text-ink-600 hover:bg-ink-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No appointments" description="No appointments on this date for the selected status." />
      ) : (
        <ol className="flex flex-col gap-3">
          {filtered.map((appointment) => {
            const patient = getPatient(appointment.patientId);
            const canCheckIn = appointment.status === "scheduled" || appointment.status === "confirmed";
            const canNoShow = (appointment.status === "scheduled" || appointment.status === "confirmed") && appointment.scheduledDate <= TODAY();
            return (
              <li key={appointment.id}>
                <AppointmentCard
                  appointment={appointment}
                  actions={
                    <>
                      <span className="hidden text-xs text-ink-500 sm:inline">
                        {patient?.name ?? appointment.patientId}
                        {" · "}
                        {getDepartment(appointment.departmentId)?.name}
                        {" · "}
                        {getHospital(appointment.hospitalId)?.name}
                      </span>
                      {canCheckIn && (
                        <Button size="sm" onClick={() => void handleCheckIn(appointment)}>
                          Check In
                        </Button>
                      )}
                      {canNoShow && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actions.running !== null}
                          onClick={async () => {
                            const ok = await actions.markNoShow(appointment.id);
                            if (ok) reload();
                          }}
                        >
                          Mark No-show
                        </Button>
                      )}
                      {canCheckIn && (
                        <Button size="sm" variant="outline" onClick={() => setRescheduleTarget(appointment)}>
                          Reschedule
                        </Button>
                      )}
                      {canCheckIn && (
                        <Button size="sm" variant="outline" onClick={() => setCancelTarget(appointment)}>
                          Cancel
                        </Button>
                      )}
                    </>
                  }
                />
              </li>
            );
          })}
        </ol>
      )}

      {rescheduleTarget && (
        <RescheduleDialog
          open={Boolean(rescheduleTarget)}
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={() => {
            setRescheduleTarget(null);
            reload();
          }}
        />
      )}

      {cancelTarget && (
        <CancelAppointmentDialog
          open={Boolean(cancelTarget)}
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={() => {
            setCancelTarget(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
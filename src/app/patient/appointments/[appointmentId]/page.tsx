"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useAsync } from "@/lib/use-async";
import { appointmentsMockApi } from "@/features/appointments/api/appointments.mock";
import { useAppointmentActions } from "@/features/appointments/hooks/useAppointments";
import { AppointmentCard } from "@/features/appointments/components/AppointmentCard";
import { CheckInResult } from "@/features/appointments/components/CheckInResult";
import { RescheduleDialog } from "@/features/appointments/components/RescheduleDialog";
import { CancelAppointmentDialog } from "@/features/appointments/components/CancelAppointmentDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import type { AppointmentWithToken } from "@/services/appointments/types";

export default function PatientAppointmentDetailPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const { data, isLoading, error, reload } = useAsync(
    () => appointmentsMockApi.getById(appointmentId),
    [appointmentId]
  );
  const actions = useAppointmentActions();
  const [checkInResult, setCheckInResult] = useState<AppointmentWithToken | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Appointment not found."} onRetry={reload} />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const canCheckIn =
    (data.status === "scheduled" || data.status === "confirmed") && data.scheduledDate === today;
  const actionable = ["scheduled", "confirmed"].includes(data.status);

  if (checkInResult) {
    return (
      <div className="mx-auto w-full max-w-md">
        <CheckInResult result={checkInResult} />
        <div className="mt-4 flex justify-center">
          <Link
            href="/patient/queue"
            className="rounded-btn bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Track Queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-2xl font-bold text-ink-900">Appointment</h1>
        <Link
          href="/patient/appointments"
          className="rounded-btn border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
        >
          Back to Appointments
        </Link>
      </div>

      <AppointmentCard appointment={data} />

      {actions.error && (
        <p role="alert" className="rounded-card border border-status-danger-soft bg-status-danger-soft p-3 text-sm text-status-danger">
          {actions.error}
        </p>
      )}

      {canCheckIn && (
        <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
          <h2 className="text-lg font-semibold text-ink-900">Check-in</h2>
          <p className="mt-1 text-sm text-ink-500">
            On your appointment day, check in here to receive a queue token.
          </p>
          <Button
            className="mt-4"
            size="lg"
            disabled={actions.running !== null}
            onClick={async () => {
              const result = await actions.checkIn(data.id);
              if (result) setCheckInResult(result);
            }}
          >
            {actions.running ? "Checking in..." : "Check In"}
          </Button>
        </section>
      )}

      {actionable && data.scheduledDate >= today && (
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setRescheduleOpen(true)}>
            Reschedule
          </Button>
          <Button variant="outline" onClick={() => setCancelOpen(true)}>
            Cancel
          </Button>
        </div>
      )}

      <RescheduleDialog
        open={rescheduleOpen}
        appointment={data}
        onClose={() => setRescheduleOpen(false)}
        onRescheduled={() => {
          setRescheduleOpen(false);
          reload();
        }}
      />
      <CancelAppointmentDialog
        open={cancelOpen}
        appointment={data}
        onClose={() => setCancelOpen(false)}
        onCancelled={() => {
          setCancelOpen(false);
          reload();
        }}
      />
    </div>
  );
}
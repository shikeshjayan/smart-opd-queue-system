"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { AppointmentList } from "@/features/appointments/components/AppointmentList";
import { AppointmentReminder } from "@/features/appointments/components/AppointmentReminder";
import { RescheduleDialog } from "@/features/appointments/components/RescheduleDialog";
import { CancelAppointmentDialog } from "@/features/appointments/components/CancelAppointmentDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import type { Appointment } from "@/services/appointments/types";
import { DEMO_PATIENT_ID } from "@/config/app";

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const patientId = user?.id ?? DEMO_PATIENT_ID;
  const { data, isLoading, error, reload } = useAppointments(patientId);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">My Appointments</h1>
          <p className="mt-1 text-sm text-ink-500">
            {data?.filter((a) => ["scheduled", "confirmed", "checked_in"].includes(a.status)).length ?? 0}{" "}
            upcoming
          </p>
        </div>
        <Link
          href="/patient/appointments/book"
          className="inline-flex h-11 items-center rounded-btn bg-brand-600 px-5 font-medium text-white transition-colors hover:bg-brand-700"
        >
          Book Appointment
        </Link>
      </div>

      {data && data.length > 0 && (
        <AppointmentReminder appointments={data} />
      )}

      {!data || data.length === 0 ? (
        <EmptyState
          title="No appointments"
          description="Book an appointment at one of the government hospitals."
          action={
            <Link
              href="/patient/appointments/book"
              className="inline-flex h-11 items-center rounded-btn bg-brand-600 px-5 font-medium text-white transition-colors hover:bg-brand-700"
            >
              Book Appointment
            </Link>
          }
        />
      ) : (
        <AppointmentList
          appointments={data}
          actionsFor={(appointment) => {
            const isUpcoming = ["scheduled", "confirmed", "checked_in"].includes(appointment.status);
            return (
              <>
                <Link
                  href={`/patient/appointments/${appointment.id}`}
                  className="rounded-btn border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                >
                  {isUpcoming ? "View Details" : "Details"}
                </Link>
                {isUpcoming && appointment.status !== "checked_in" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRescheduleTarget(appointment)}
                  >
                    Reschedule
                  </Button>
                )}
                {isUpcoming && appointment.status !== "checked_in" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCancelTarget(appointment)}
                  >
                    Cancel
                  </Button>
                )}
              </>
            );
          }}
        />
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
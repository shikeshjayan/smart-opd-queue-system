"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/features/medical-records/utils/format";
import { formatSlotTime } from "@/features/appointments/utils/appointments-validation";
import type { Appointment } from "@/services/appointments/types";
import { DEMO_PATIENT_ID } from "@/config/app";

export default function BookAppointmentPage() {
  const { user } = useAuth();
  const patientId = user?.id ?? DEMO_PATIENT_ID;
  const [booked, setBooked] = useState<Appointment | null>(null);

  if (booked) {
    return (
      <div className="mx-auto w-full max-w-md">
        <section className="rounded-card border border-ink-200 bg-surface p-6 text-center shadow-card">
          <span
            aria-hidden="true"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-success-soft text-2xl text-status-success"
          >
            ✓
          </span>
          <h1 className="mt-3 text-2xl font-bold text-ink-900">Appointment booked</h1>
          <p className="mt-1 text-sm text-ink-500">
            {formatDate(booked.scheduledDate)}
            {booked.scheduledTime ? ` at ${formatSlotTime(booked.scheduledTime)}` : ""}
          </p>
          <p className="mt-1 text-sm text-ink-500">#{booked.id}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/patient/appointments"
              className="flex h-12 items-center justify-center rounded-btn bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              My Appointments
            </Link>
            <Button variant="outline" size="lg" onClick={() => setBooked(null)}>
              Book Another
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Book Appointment</h1>
        <p className="mt-1 text-sm text-ink-500">
          Choose a hospital, department and an available slot.
        </p>
      </div>
      <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
        <AppointmentForm patientId={patientId} onBooked={setBooked} />
      </section>
    </div>
  );
}
"use client";

import { usePatientDashboard } from "@/features/patient/hooks/usePatient";
import { ActiveTokenCard } from "@/features/patient/components/ActiveTokenCard";
import { QuickActions } from "@/features/patient/components/QuickActions";
import { PatientStats } from "@/features/patient/components/PatientStats";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import Link from "next/link";
import { AllergyWarning } from "@/features/medication/components/AllergyWarning";
import { MedicationList } from "@/features/medication/components/MedicationList";
import { usePatientMedicationPanel } from "@/features/medication/hooks/usePatientMedicationPanel";
import { MyTests } from "@/features/diagnostics/components/MyTests";
import { usePatientTests } from "@/features/diagnostics/hooks/useDiagnosticResults";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAppointments, useFollowUpRecommendation } from "@/features/appointments/hooks/useAppointments";
import { AppointmentCard } from "@/features/appointments/components/AppointmentCard";
import { AppointmentReminder } from "@/features/appointments/components/AppointmentReminder";
import { FollowUpForm } from "@/features/appointments/components/FollowUpForm";

export default function DashboardPage() {
  const { user } = useAuth();
  const patientId = user?.id ?? "";
  const { data, isLoading, error, reload } = usePatientDashboard();
  const medicationPanel = usePatientMedicationPanel();
  const tests = usePatientTests(patientId);
  const appointmentList = useAppointments(patientId);
  const recommendation = useFollowUpRecommendation(patientId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  if (!data) return null;

  const { activeToken, quickActions, stats, notifications } = data;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>

      {activeToken ? (
        <ActiveTokenCard bundle={activeToken} />
      ) : (
        <EmptyState
          title="No active OPD token"
          description="You don't have a token right now. Select a hospital to get started."
          action={
            <Link
              href="/patient/hospitals"
              className="inline-flex h-11 items-center rounded-btn bg-brand-600 px-5 font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Get a Token
            </Link>
          }
        />
      )}

      <QuickActions actions={quickActions} />
      <PatientStats stats={stats} />

      {medicationPanel.error ? (
        <p className="rounded-card border border-status-danger-soft bg-status-danger-soft p-4 text-sm text-status-danger">
          {medicationPanel.error}
        </p>
      ) : medicationPanel.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AllergyWarning allergies={medicationPanel.allergies ?? []} />
          <MedicationList
            entries={medicationPanel.medications.data ?? []}
            historyHref="/patient/prescriptions"
          />
        </div>
      )}

      {tests.error ? (
        <p className="rounded-card border border-status-danger-soft bg-status-danger-soft p-4 text-sm text-status-danger">
          {tests.error}
        </p>
      ) : tests.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <MyTests entries={tests.data ?? []} />
      )}

      {recommendation.data && !appointmentList.isLoading && (
        <FollowUpForm
          patientId={patientId}
          encounterId={recommendation.data.encounter.id}
          departmentId={recommendation.data.encounter.departmentId}
          doctorId={recommendation.data.encounter.doctorId}
          followUp={recommendation.data.followUp}
          onBooked={() => appointmentList.reload()}
        />
      )}

      {!(appointmentList.isLoading || tests.isLoading) && (() => {
        const today = new Date().toISOString().slice(0, 10);
        const upcoming = (appointmentList.data ?? [])
          .filter((a) => ["scheduled", "confirmed", "checked_in"].includes(a.status) && a.scheduledDate >= today)
          .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
        if (upcoming.length === 0) return null;
        return (
          <div className="flex flex-col gap-3">
            <AppointmentReminder appointments={appointmentList.data ?? []} />
            <section aria-labelledby="upcoming-appts-title" className="flex flex-col gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <h2 id="upcoming-appts-title" className="text-lg font-semibold text-ink-900">
                  Upcoming Appointments
                </h2>
                <Link href="/patient/appointments" className="text-sm font-medium text-brand-700 hover:underline">
                  View all
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {upcoming.slice(0, 2).map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </section>
          </div>
        );
      })()}

      {notifications.length > 0 && (
        <section aria-labelledby="notifications-title">
          <h2 id="notifications-title" className="text-lg font-semibold text-ink-900">
            Notifications
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className="rounded-card border border-ink-200 bg-surface p-3 shadow-card"
              >
                <p className="text-sm text-ink-900">{notif.message}</p>
                <p className="mt-0.5 text-xs text-ink-400">{notif.time}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
